# CampusBite — Local & Cloud Setup Guide

This guide provides instructions to run CampusBite locally for development, evaluation, and deployment to AWS.

---

## 1. Prerequisites

- **Node.js**: v18.x, v20.x, or v22.x (`node -v`)
- **npm**: v9.x or v10.x (`npm -v`)
- **AWS CLI** (Optional, only needed if deploying to AWS EC2 / DynamoDB Cloud)

---

## 2. Quick Local Start (College Lab / Offline Mode)

CampusBite includes a persistent local DynamoDB store mode that works out-of-the-box without requiring AWS credit card details or network connections.

### Step 1: Backend Setup
```bash
cd backend

# Install dependencies (Express, Socket.IO, AWS SDK v3, bcrypt, etc.)
npm install

# Initialize default seed items (28 authentic menu items + canteen settings)
npm run seed

# Start backend server (Runs on http://localhost:5050)
npm run dev
```

### Step 2: Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies (React, Vite, Lucide React, jsPDF, etc.)
npm install

# Start Vite dev server (Runs on http://localhost:5175)
npm run dev
```

Open **`http://localhost:5175`** in your browser.

---

## 3. First-Time Owner Initialization

1. Open `http://localhost:5175/owner/setup`.
2. Fill in:
   - **Name**: `Canteen Master`
   - **Email**: `canteen.owner@college.edu`
   - **Password**: `Admin@12345` (Minimum 8 characters)
3. Submit the form.
4. The system initializes the single authorized Master Owner account and locks public registration.

### Resetting Owner Password (If Forgotten)
Run the backend administrative script from the `backend/` directory:
```bash
npm run reset-owner -- "NewAdminPassword123"
```

---

## 4. Connecting to Live Amazon Web Services (AWS)

To connect the application to genuine AWS services:

1. Open `backend/.env`.
2. Provide your AWS credentials and region:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...YOUR_ACCESS_KEY...
   AWS_SECRET_ACCESS_KEY=...YOUR_SECRET_KEY...
   ```
3. Provision DynamoDB tables on AWS:
   ```bash
   cd backend
   npm run create-tables
   ```
4. Seed the newly created AWS DynamoDB tables:
   ```bash
   npm run seed
   ```
5. Restart the backend server. The logs will confirm:
   ```
   [DynamoDB] AWS Cloud Mode active. Target Region: us-east-1
   ```

---

## 5. Amazon EC2 Deployment Commands

1. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu 22.04 LTS).
2. Attach the IAM instance profile role created from `backend/aws/iam/ec2-instance-role-policy.json`.
3. SSH into the instance:
   ```bash
   sudo yum install -y git nodejs npm
   git clone <repo-url> campusbite
   cd campusbite/backend
   npm install --production
   sudo npm install -g pm2
   pm2 start src/server.js --name "campusbite-backend"
   pm2 startup
   pm2 save
   ```
4. Verify health check:
   ```bash
   curl http://localhost:5050/api/health
   ```
