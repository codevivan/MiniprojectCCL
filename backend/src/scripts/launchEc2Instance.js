import { 
  EC2Client, 
  RunInstancesCommand, 
  DescribeInstancesCommand, 
  CreateTagsCommand 
} from '@aws-sdk/client-ec2';

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';
const ec2 = new EC2Client({ region, credentials });

const userDataScript = `#!/bin/bash
exec > >(tee /var/log/campusbite-setup.log|logger -t campusbite-setup -s 2>/dev/console) 2>&1
set -e

echo "=== [1/5] Updating and installing dependencies ==="
dnf update -y
dnf install -y git nginx unzip openssl awscli
dnf module enable nodejs:20 -y || true
dnf install -y nodejs
npm install -g pm2

echo "=== [2/5] Configuring self-signed SSL for HTTPS ==="
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout /etc/nginx/ssl/campusbite.key \\
  -out /etc/nginx/ssl/campusbite.crt \\
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=CampusBite/OU=CCL/CN=campusbite.local"

echo "=== [3/5] Configuring Nginx reverse proxy ==="
cat << 'NGINX_EOF' > /etc/nginx/conf.d/campusbite.conf
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl default_server;
    server_name _;
    client_max_body_size 10M;

    ssl_certificate /etc/nginx/ssl/campusbite.crt;
    ssl_certificate_key /etc/nginx/ssl/campusbite.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
NGINX_EOF

systemctl restart nginx
systemctl enable nginx

echo "=== [4/5] Downloading CampusBite release bundle from S3 ==="
mkdir -p /var/www/campusbite
cd /var/www/campusbite
aws s3 cp s3://campusbite-food-images-2026/deploy/campusbite-release.zip /tmp/campusbite-release.zip --region eu-north-1
unzip -o /tmp/campusbite-release.zip -d /var/www/campusbite

echo "=== [5/5] Launching CampusBite with PM2 ==="
cd /var/www/campusbite/backend
npm install --omit=dev

cd /var/www/campusbite
pm2 start ecosystem.config.cjs
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true
pm2 save

echo "=== CampusBite EC2 Deployment Complete ==="
`;

const userDataBase64 = Buffer.from(userDataScript).toString('base64');

async function launchInstance() {
  console.log('=== Launching CampusBite EC2 Instance in eu-north-1 ===');

  const params = {
    ImageId: 'ami-03738577e0413f59b', // Amazon Linux 2023 Free Tier
    InstanceType: 't3.micro', // Free Tier
    KeyName: 'ec2-lab-key',
    MinCount: 1,
    MaxCount: 1,
    SubnetId: 'subnet-00c4a47b75a68bb87', // CampusBite-PublicSubnet-1
    SecurityGroupIds: ['sg-0634ff01f16b50511'], // CampusBite-EC2-SecurityGroup
    IamInstanceProfile: { Name: 'CampusBite-EC2-Role' },
    UserData: userDataBase64,
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: 'CampusBite' },
          { Key: 'Project', Value: 'CampusBite' },
          { Key: 'Application', Value: 'CampusBite' },
          { Key: 'Environment', Value: 'Production' }
        ]
      }
    ]
  };

  try {
    const runRes = await ec2.send(new RunInstancesCommand(params));
    const instance = runRes.Instances[0];
    const instanceId = instance.InstanceId;
    console.log('[EC2 SUCCESS] Launched Instance ID:', instanceId);

    console.log('Waiting for instance to initialize and receive public IP...');
    let publicIp = null;

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 6000));
      const desc = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const inst = desc.Reservations[0].Instances[0];
      const state = inst.State?.Name;
      publicIp = inst.PublicIpAddress;
      console.log(`[Status ${i + 1}] State: ${state}, Public IP: ${publicIp || 'pending...'}`);
      if (state === 'running' && publicIp) {
        break;
      }
    }

    console.log('\n--- EC2 Instance Launch Summary ---');
    console.log('INSTANCE_ID=' + instanceId);
    console.log('PUBLIC_IP=' + publicIp);
    console.log(`HTTP_URL=http://${publicIp}`);
    console.log(`HTTPS_URL=https://${publicIp}`);
    console.log(`HEALTH_CHECK=http://${publicIp}/api/health`);
  } catch (err) {
    console.error('[EC2 Launch Error]', err);
  }
}

launchInstance();
