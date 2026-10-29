# CampusBite — AWS Cloud Architecture Documentation

This document explains the cloud architecture designed for **CampusBite (Cloud-Based Canteen Pre-Order & Token Management System)** as part of the College Cloud Computing Lab (CCL) curriculum.

---

## 1. High-Level Architecture Overview

CampusBite implements a multi-tier cloud architecture on Amazon Web Services (AWS), balancing virtualized compute instances (EC2) with managed serverless services (DynamoDB, S3, Cognito, Lambda, CloudWatch).

```
                      +------------------------------------------+
                      |         Student & Owner Clients          |
                      |   (React 18 + Vite + HTML5 + CSS3)       |
                      +--------------------+---------------------+
                                           |
                              HTTP REST    |   WebSocket (Socket.IO)
                                           v
+-----------------------------------------------------------------------------------------+
| AWS Virtual Private Cloud (VPC) - 10.0.0.0/16                                           |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | Public Subnet (10.0.1.0/24)                                                     |   |
|   |   Internet Gateway (IGW)                                                        |   |
|   |   Application Load Balancer (ALB) / Nginx Reverse Proxy (Port 80/443)            |   |
|   +---------------------------------------+-----------------------------------------+   |
|                                           |                                             |
|   +---------------------------------------v-----------------------------------------+   |
|   | Application Subnet (10.0.2.0/24)                                                |   |
|   |                                                                                 |   |
|   |   [ Amazon EC2 Instance ] (t3.small / t4g.small)                                |   |
|   |     - Node.js & Express.js REST API Server                                      |   |
|   |     - Socket.IO Server (Real-time Token Updates)                                |   |
|   |     - PM2 Process Manager / systemd                                             |   |
|   |     - AWS SDK for JavaScript v3                                                 |   |
|   |     - IAM Instance Profile Attached (No hardcoded keys)                         |   |
|   +-------------------+--------------------+--------------------+-------------------+   |
+-----------------------|--------------------|--------------------|-----------------------+
                        |                    |                    |
                        v                    v                    v
         +-----------------------+  +------------------+  +-------------------+
         |    Amazon DynamoDB    |  |    Amazon S3     |  |   Amazon Cognito  |
         | (On-Demand / Pay-Per) |  | (Image Storage)  |  |    (User Pool)    |
         |                       |  |                  |  |                   |
         | - CampusBite_Users    |  | Bucket:          |  | - Student Sign-up |
         | - CampusBite_Menu     |  | campusbite-      |  | - Owner Admin     |
         | - CampusBite_Orders   |  | food-assets      |  | - JWT ID Tokens   |
         | - CampusBite_Tokens   |  |                  |  | - Token Verification|
         | - CampusBite_Payments |  +------------------+  +-------------------+
         | - CampusBite_Settings |
         +-----------+-----------+
                     |
                     v
         +-----------------------+           +-----------------------+
         |      AWS Lambda       |           |   Amazon CloudWatch   |
         |                       |           |                       |
         | Async Event Trigger:  | --------> | - API Error Logs      |
         | CampusBite_Order-     |           | - CloudWatch Alarms   |
         | Notification          |           | - Metrics Dashboard   |
         +-----------------------+           +-----------------------+
```

---

## 2. AWS Services Breakdown & Implementation

### A. Amazon EC2 (Elastic Compute Cloud) & VPC
- **Role**: Hosts the long-running Node.js & Express API backend and the Socket.IO WebSocket server.
- **Why EC2 over Pure Serverless**:
  - WebSocket state: Socket.IO requires persistent TCP connections to broadcast real-time state changes to specific student rooms and the kitchen dashboard without connection setup overhead.
  - Consistent low-latency order response without serverless cold starts.
- **Networking Configuration (Amazon VPC)**:
  - Custom VPC with CIDR `10.0.0.0/16`.
  - Public subnets in two Availability Zones (`10.0.1.0/24`, `10.0.2.0/24`) attached to an Internet Gateway.
  - Security Groups:
    - **ALB Security Group**: Inbound TCP 80/443 from `0.0.0.0/0`.
    - **EC2 Security Group**: Inbound TCP 5050 ONLY from the ALB Security Group (strict least privilege). No database ports exposed to the public internet.

### B. Amazon DynamoDB (Primary Application Database)
- **Role**: Primary and only persistent data store.
- **SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`).
- **Billing Mode**: `PAY_PER_REQUEST` (On-Demand Capacity), perfectly aligned with college canteen spikes during lunch and zero idle cost.
- **Atomic Concurrency-Safe Operations**:
  - Daily token incrementing uses DynamoDB atomic `UpdateCommand` with `ADD currentSequence :inc` on the `CampusBite_Tokens` table.
  - Idempotency checks and conditional writes (`ConditionExpression: attribute_not_exists(...)`) prevent duplicate orders or duplicate account creation.

### C. Amazon S3 (Simple Storage Service)
- **Role**: Stores high-resolution food images and optionally archived receipt PDFs.
- **Security**:
  - Bucket name: `campusbite-food-assets`.
  - Public access blocked by default; files served via S3 presigned URLs or CloudFront distribution.
  - Backend uses `@aws-sdk/s3-request-presigner` for authorized direct client uploads.

### D. Amazon Cognito
- **Role**: Student identity provider and token verification.
- **User Pool**: Configured with email verification, standard password complexity, and custom attribute `custom:role` (`STUDENT` or `OWNER`).
- **Backend Token Validation**: Utilizes `aws-jwt-verify` to validate ID tokens and decode cryptographic claims (`sub`, `email`, `custom:role`).
- **Offline / Local Dev Mode**: When testing locally without internet/AWS credentials, the backend uses a local JWT engine that generates and verifies identical token claims.

### E. AWS Lambda
- **Role**: Asynchronous background event processor.
- **Function**: `CampusBite_OrderNotification`.
- **Trigger**: Express backend invokes Lambda asynchronously (`InvocationType: 'Event'`) immediately after persisting a new order in DynamoDB.
- **Function Task**: Formats notification payloads, creates log entries, and simulates email/SMS dispatch without delaying the student's checkout response.

### F. Amazon CloudWatch
- **Role**: Centralized logging, metrics collection, and alerting.
- **Log Group**: `/campusbite/backend-api`.
- **Metrics Tracked**:
  - EC2 CPU and memory utilization.
  - DynamoDB read/write capacity units consumed.
  - Lambda execution invocations and error rate.
  - HTTP 4xx and 5xx API error rates.
- **Security**: Sensitive parameters (`password`, `passwordHash`, `cardNumber`, `cvv`) are automatically sanitized and redacted before any log entry is recorded.

### G. AWS IAM (Identity and Access Management)
- **Role**: Least-privilege access governance.
- **Implementation**: The EC2 instance accesses DynamoDB, S3, Lambda, and CloudWatch strictly via an attached **IAM Instance Profile Role**. Permanent access keys are never hardcoded in source code or committed to Git.
