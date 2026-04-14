import paramiko, io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

LOCAL_DUMP = r"C:\Users\Windows 10\Desktop\birgaquramiz\birga_backup_20260409_020001.sql"
REMOTE_DUMP = "/home/deploy/birga_restore.sql"

HOST     = "178.104.170.72"
USER     = "deploy"
PASSWORD = "BirgaDeploy2026!"
DB       = "birga_app"
DB_USER  = "birga_admin"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

# 1. Upload dump file via SFTP
print("Uploading dump file...")
sftp = client.open_sftp()
sftp.put(LOCAL_DUMP, REMOTE_DUMP)
sftp.close()
print(f"Uploaded {os.path.getsize(LOCAL_DUMP):,} bytes → {REMOTE_DUMP}")

def run(cmd):
    print(f"\n$ {cmd[:100]}")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode(errors="replace").strip()
    err = stderr.read().decode(errors="replace").strip()
    rc = stdout.channel.recv_exit_status()
    if out: print(out[:3000])
    if err and rc != 0: print("ERR:", err[:500])
    return rc, out, err

# 2. Restore into the database
print("\nRestoring dump into birga_app...")
rc, out, err = run(
    f"docker exec -i birga-postgres psql -U {DB_USER} -d {DB} < {REMOTE_DUMP}"
)

if rc == 0:
    print("\nVerifying row counts...")
    tables = ["User", "Seller", "Product", "Order", "Category", "Brand"]
    for t in tables:
        _, out, _ = run(
            f'docker exec birga-postgres psql -U {DB_USER} -d {DB} -tAc "SELECT COUNT(*) FROM \\"{t}\\""'
        )
        print(f"  {t}: {out.strip()} rows")
else:
    print(f"\nRestore failed (rc={rc})")
    print(err[:1000])

# 3. Cleanup
run(f"rm {REMOTE_DUMP}")
client.close()
print("\nDone.")
