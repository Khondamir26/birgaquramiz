import paramiko, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.104.170.72", username="deploy", password="BirgaDeploy2026!", timeout=15)

def run(cmd):
    print(f"\n$ {cmd[:100]}")
    _, stdout, _ = client.exec_command(cmd)
    out = stdout.read().decode(errors="replace").strip()
    print(out[:2000] if out else "(empty)")

# 1. UFW
run("sudo -n ufw status verbose")

# 2. Fail2ban
run("sudo -n fail2ban-client status")
run("sudo -n fail2ban-client status sshd")

# 3. SSH config - check root login & password auth
run("sudo -n sshd -T 2>/dev/null | grep -E 'permitrootlogin|passwordauthentication|maxauthtries|logingracetime'")

# 4. Unattended upgrades
run("systemctl is-active unattended-upgrades")

# 5. Open ports on the host
run("sudo -n ss -tlnp")

# 6. Last SSH login attempts (failed)
run("sudo -n grep 'Failed password' /var/log/auth.log | tail -10")

# 7. Currently banned IPs
run("sudo -n fail2ban-client status sshd | grep 'Banned IP'")

# 8. Docker exposed ports (make sure nothing extra is open)
run("docker ps --format 'table {{.Names}}\t{{.Ports}}'")

# 9. System users with login shell (should only be root + deploy)
run("grep -E '/bin/bash|/bin/sh' /etc/passwd | grep -v nologin")

# 10. Uptime + kernel
run("uname -r && uptime")

client.close()
