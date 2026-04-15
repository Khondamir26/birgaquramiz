#!/usr/bin/env python3
"""
Full server provisioning script for Hetzner VPS (Ubuntu 24.04).
Steps 1-3 (packages, deploy user, SSH hardening) already completed.
This run continues from UFW onward, connecting as the 'deploy' user.

Usage:  py -3 ops/provision_server.py
"""

import sys
import io
import time
import shlex
import paramiko

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

HOST            = "178.104.170.72"
USER            = "deploy"
PASSWORD        = "BirgaDeploy2026!"
DEPLOY_USER     = "deploy"
DEPLOY_PASSWORD = "BirgaDeploy2026!"

# ── helper ────────────────────────────────────────────────────────────────────

def run(client, cmd, check=True, root=False):
    """Execute a command. If root=True, runs via 'sudo -S' with password sent to stdin."""
    if root:
        full_cmd = f"sudo -S -p '' -- bash -c {shlex.quote(cmd)}"
    else:
        full_cmd = cmd
    print(f"\n$ {'(sudo) ' if root else ''}{cmd[:110]}")
    stdin, stdout, stderr = client.exec_command(full_cmd, get_pty=False)
    if root:
        stdin.write(DEPLOY_PASSWORD + "\n")
        stdin.flush()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    rc  = stdout.channel.recv_exit_status()
    clean_err = "\n".join(
        l for l in err.splitlines()
        if not l.startswith("[sudo]") and l.strip()
    )
    if out.strip():
        print(out.strip()[:3000])
    if clean_err and rc != 0:
        print("STDERR:", clean_err[:500])
    if check and rc not in (0, None):
        raise RuntimeError(f"Command failed (rc={rc}): {cmd[:80]}")
    return out

def run_ok(client, cmd, root=False):
    return run(client, cmd, check=False, root=root)


# ── steps ────────────────────────────────────────────────────────────────────

STEPS = []

def step(title):
    def decorator(fn):
        STEPS.append((title, fn))
        return fn
    return decorator


SKIP_TO = ""   # run all steps; Docker step itself checks if already installed

@step("UFW firewall")
def s4(c):
    run(c, "ufw --force reset",        root=True)
    run(c, "ufw default deny incoming", root=True)
    run(c, "ufw default allow outgoing",root=True)
    run(c, "ufw allow OpenSSH",         root=True)
    run(c, "ufw allow 80/tcp",          root=True)
    run(c, "ufw allow 443/tcp",         root=True)
    run(c, "ufw --force enable",        root=True)
    run(c, "ufw status verbose",        root=True)


@step("Fail2ban")
def s5(c):
    run(c, "cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local", root=True)
    run(c, r"sed -i 's/^#*bantime\s*=.*/bantime = 1h/'   /etc/fail2ban/jail.local",  root=True)
    run(c, r"sed -i 's/^#*findtime\s*=.*/findtime = 10m/' /etc/fail2ban/jail.local", root=True)
    run(c, r"sed -i 's/^#*maxretry\s*=.*/maxretry = 5/'   /etc/fail2ban/jail.local", root=True)
    run(c, "systemctl enable fail2ban", root=True)
    run(c, "systemctl restart fail2ban", root=True)
    run_ok(c, "fail2ban-client status sshd", root=True)


@step("Unattended security upgrades")
def s6(c):
    run_ok(c, "DEBIAN_FRONTEND=noninteractive dpkg-reconfigure -plow unattended-upgrades", root=True)


@step("Install Docker (official repo)")
def s7(c):
    out = run_ok(c, "docker --version 2>/dev/null")
    if "Docker version" in out:
        print("  Docker already installed.")
        # Make sure deploy user is in docker group
        run(c, f"usermod -aG docker {DEPLOY_USER}", root=True)
        return
    run(c, "install -m 0755 -d /etc/apt/keyrings", root=True)
    run(c, "curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc", root=True)
    run(c, "chmod a+r /etc/apt/keyrings/docker.asc", root=True)
    run(c,
        "ARCH=$(dpkg --print-architecture); "
        "VER=$(. /etc/os-release && echo $VERSION_CODENAME); "
        'echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.asc] '
        'https://download.docker.com/linux/ubuntu $VER stable" '
        '> /etc/apt/sources.list.d/docker.list',
        root=True)
    run(c, "apt-get update -qq", root=True)
    run(c, "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "
           "docker-ce docker-ce-cli containerd.io "
           "docker-buildx-plugin docker-compose-plugin", root=True)
    run(c, "systemctl enable docker", root=True)
    run(c, "systemctl start docker",  root=True)
    run(c, f"usermod -aG docker {DEPLOY_USER}", root=True)


@step("Docker daemon – log rotation")
def s8(c):
    run(c, "mkdir -p /etc/docker", root=True)
    # Write daemon.json via tee (avoids quoting hell)
    run(c,
        "printf '%s' "
        r'"{\"log-driver\":\"json-file\",\"log-opts\":{\"max-size\":\"10m\",\"max-file\":\"5\"}}"'
        " | tee /etc/docker/daemon.json > /dev/null",
        root=True)
    run(c, "systemctl restart docker", root=True)
    run_ok(c, "docker info 2>/dev/null | grep -A3 'Logging Driver'")


@step("Prepare project directory & backup dir")
def s9(c):
    run(c, f"mkdir -p /home/{DEPLOY_USER}/birgaquramiz")
    run(c, "mkdir -p /var/backups/birga", root=True)
    run(c, f"chown {DEPLOY_USER}:{DEPLOY_USER} /var/backups/birga", root=True)


@step("Install backup cron (2:30 AM daily)")
def s10(c):
    cron_content = (
        "30 21 * * * deploy "
        "DATABASE_URL=$(grep ^DATABASE_URL /home/deploy/birgaquramiz/.env | cut -d= -f2-) "
        "TELEGRAM_BOT_TOKEN=$(grep ^TELEGRAM_BOT_TOKEN /home/deploy/birgaquramiz/.env | cut -d= -f2-) "
        "TELEGRAM_CHAT_ID=$(grep ^TELEGRAM_CHAT_ID /home/deploy/birgaquramiz/.env | cut -d= -f2-) "
        "BACKUP_DIR=/var/backups/birga "
        "/home/deploy/birgaquramiz/ops/backup-postgres.sh "
        ">> /var/log/birga-backup.log 2>&1\\n"
    )
    run(c, f"printf '{cron_content}' > /etc/cron.d/birga-backup", root=True)
    run(c, "chmod 644 /etc/cron.d/birga-backup", root=True)


@step("Fix sudoers – give deploy full NOPASSWD docker + compose")
def s_sudoers(c):
    # Broad NOPASSWD for deploy service account
    run(c,
        f"printf '%s\\n' '{DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL' "
        f"> /etc/sudoers.d/{DEPLOY_USER}",
        root=True)
    run(c, f"chmod 440 /etc/sudoers.d/{DEPLOY_USER}", root=True)


@step("Final status")
def s11(c):
    run_ok(c, "sudo -n ufw status",           root=False)
    run_ok(c, "sudo -n fail2ban-client status",root=False)
    run_ok(c, "docker --version && docker compose version")
    run_ok(c, f"id {DEPLOY_USER}")
    run_ok(c, "df -h /")
    run_ok(c, "free -h")


# ── entrypoint ────────────────────────────────────────────────────────────────

def main():
    print(f"Connecting to {HOST} as {USER} …")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    print("Connected.\n")

    skipping = bool(SKIP_TO)
    for title, fn in STEPS:
        if skipping:
            if title == SKIP_TO:
                skipping = False
            else:
                print(f"  SKIP: {title}")
                continue
        print(f"\n{'='*60}")
        print(f"  STEP: {title}")
        print("="*60)
        fn(client)
        time.sleep(0.5)

    client.close()

    print("\n\n" + "="*60)
    print("  SERVER PROVISIONING COMPLETE")
    print("="*60)
    print(f"\n  IP            : {HOST}")
    print(f"  Deploy user   : {DEPLOY_USER}")
    print(f"  Deploy pass   : {DEPLOY_PASSWORD}")
    print(f"  Root login    : disabled (key only)")
    print(f"  Firewall      : UFW (80, 443, SSH only)")
    print(f"  Brute-force   : Fail2ban (5 tries / 1h ban)")
    print(f"  Docker        : installed")
    print(f"  Backups       : nightly 02:30 → /var/backups/birga")
    print("\n  GitHub Secrets to configure:")
    print("  ────────────────────────────")
    print(f"  HETZNER_IP       = {HOST}")
    print(f"  HETZNER_USERNAME = {DEPLOY_USER}")
    print(f"  HETZNER_PASSWORD = {DEPLOY_PASSWORD}")
    print("\n  (DATABASE_URL, JWT_SECRET, etc. must also be set)")
    print("="*60)


if __name__ == "__main__":
    main()
