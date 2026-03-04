# Hetzner VPS Hardening Checklist

## 1) Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw delete allow 3000/tcp || true
sudo ufw delete allow 5000/tcp || true
sudo ufw --force enable
sudo ufw status verbose
```

## 2) Fail2ban

```bash
sudo apt-get update
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo sed -i "s/^#*bantime.*/bantime = 1h/" /etc/fail2ban/jail.local
sudo sed -i "s/^#*findtime.*/findtime = 10m/" /etc/fail2ban/jail.local
sudo sed -i "s/^#*maxretry.*/maxretry = 5/" /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

## 3) Automatic Security Updates

```bash
sudo apt-get install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 4) Docker Log Rotation

`docker-compose.yml` already sets per-service rotation (`max-size=10m`, `max-file=5`).

Optional daemon-level defaults:

```bash
sudo mkdir -p /etc/docker
cat <<'EOF' | sudo tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
EOF
sudo systemctl restart docker
```

## 5) Database Backups

Use [backup-postgres.sh](/c:/Users/Windows%2010/Desktop/birgaquramiz/ops/backup-postgres.sh) with cron:

```bash
chmod +x ./ops/backup-postgres.sh
DATABASE_URL='postgresql://user:pass@host:5432/db' BACKUP_DIR='/var/backups/birga' ./ops/backup-postgres.sh
```

Nightly cron (02:30):

```bash
30 2 * * * DATABASE_URL='postgresql://user:pass@host:5432/db' BACKUP_DIR='/var/backups/birga' /home/<user>/birgaquramiz/ops/backup-postgres.sh >> /var/log/birga-backup.log 2>&1
```

## 6) Volume Persistence Verification

```bash
docker volume ls | grep backend_uploads
docker volume inspect birgaquramiz_backend_uploads || docker volume inspect backend_uploads
```
