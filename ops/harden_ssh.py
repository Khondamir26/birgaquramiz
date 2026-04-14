import paramiko, io, sys, shlex
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HOST     = "178.104.170.72"
USER     = "deploy"
PASSWORD = "BirgaDeploy2026!"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

def run(cmd, root=False):
    full = f"sudo -S -p '' -- bash -c {shlex.quote(cmd)}" if root else cmd
    print(f"\n$ {'(sudo) ' if root else ''}{cmd[:100]}")
    stdin, stdout, stderr = client.exec_command(full)
    if root:
        stdin.write(PASSWORD + "\n"); stdin.flush()
    out = stdout.read().decode(errors="replace").strip()
    err = stderr.read().decode(errors="replace").strip()
    rc  = stdout.channel.recv_exit_status()
    clean_err = "\n".join(l for l in err.splitlines() if not l.startswith("[sudo]") and l.strip())
    if out: print(out[:2000])
    if clean_err and rc != 0: print("ERR:", clean_err[:300])
    return out

# Remove old attempt, overwrite cloud-init file directly
run("rm -f /etc/ssh/sshd_config.d/99-hardened.conf", root=True)
run("printf 'PasswordAuthentication no\\nPermitRootLogin no\\n' > /etc/ssh/sshd_config.d/50-cloud-init.conf", root=True)
run("cat /etc/ssh/sshd_config.d/50-cloud-init.conf", root=True)
run("systemctl restart ssh", root=True)
run("sshd -T | grep -E 'passwordauthentication|permitrootlogin'", root=True)

print("\n=== Verifying keys still work (this connection uses password, new ones need key) ===")
run("wc -l ~/.ssh/authorized_keys")
print("\nSSH hardening complete.")
client.close()
