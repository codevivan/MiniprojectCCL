#!/bin/bash
# ==============================================================================
# CampusBite EC2 Provisioning & Setup Script
# Region: eu-north-1 (Stockholm)
# Target OS: Ubuntu 22.04 / 24.04 LTS or Amazon Linux 2023
# ==============================================================================

set -e

echo "=== [1/5] Updating system packages ==="
if [ -f /etc/debian_version ]; then
    sudo apt-get update -y
    sudo apt-get install -y curl git nginx
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    sudo dnf update -y
    sudo dnf install -y git nginx
    # Install Node.js 20
    sudo dnf module enable nodejs:20 -y || true
    sudo dnf install -y nodejs
fi

echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "=== [2/5] Installing PM2 process manager ==="
sudo npm install -g pm2

echo "=== [3/5] Configuring Nginx Reverse Proxy (Port 80 -> Port 5050) ==="
sudo tee /etc/nginx/conf.d/campusbite.conf > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    # Backend API and WebSocket routing
    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Remove default site if on Debian/Ubuntu
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== [4/5] Setup application directory permissions ==="
sudo mkdir -p /var/www/campusbite
sudo chown -R $USER:$USER /var/www/campusbite

echo "=== [5/5] Setup Completed Successfully! ==="
echo "Next steps:"
echo "1. Clone or copy CampusBite code to /var/www/campusbite"
echo "2. Run 'npm install' in both backend and frontend"
echo "3. Run 'npm run build' in frontend"
echo "4. Start backend with 'pm2 start ecosystem.config.cjs' in /var/www/campusbite"
echo "5. Run 'pm2 startup' and 'pm2 save' to persist across reboots"
