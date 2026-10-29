# CampusBite — Cloud-Based Canteen Pre-Order & Token Management System

> **Order Smart. Skip the Queue.**  
> Built for College Cloud Computing Lab (CCL) Mini-Project Evaluation.

---

## 🍴 Overview

**CampusBite** is a modern, functional full-stack web application architected to digitize college canteen operations, eliminate queue delays during short lecture breaks, and provide real-time token tracking with simulated payment processing.

Designed according to production AWS principles, CampusBite features role-based access control (Student and Canteen Owner), Amazon DynamoDB database persistence, Socket.IO live order tracking, and client-side PDF receipt generation.

---

## 🎨 Color Palette & Design Identity

- **Forest Green**: `#174C3C` (Primary Brand & Header)
- **Fresh Green**: `#267653` (Success & Ready States)
- **Warm Orange**: `#F4A340` (Accents, CTAs & Highlights)
- **Cream**: `#FAF8F2` (Background Canvas)
- **White**: `#FFFFFF` (Surface Cards & Modals)
- **Dark Text**: `#202923` (Headings & Primary Text)
- **Muted Text**: `#737B75` (Secondary Labels & Captions)

---

## 🚀 Key Features

### For Students
- **Account Registration & Login**: College email and student roll number authentication.
- **28 Authentic Canteen Menu Items**: Filterable across Breakfast, Lunch, Fast Food, Chaat, Beverages, and Desserts.
- **Smart Shopping Cart**: Real-time quantity adjustments, price calculation, and estimated preparation time.
- **Simulated Payment Simulator**:
  - UPI (Google Pay / PhonePe simulation with demo VPA).
  - Credit Card & Debit Card simulation (Demo-only validation, zero card data stored).
  - Cash at Counter (Orders placed with `PENDING` payment status for counter verification).
- **Unique Concurrency-Safe Daily Tokens**: Emits `CB-101`, `CB-102` using DynamoDB atomic sequence counters.
- **Real-Time Live Order Tracker**: Socket.IO stepper:
  `ORDER CONFIRMED` ➔ `PREPARING` ➔ `READY FOR PICKUP` ➔ `COMPLETED`
- **Downloadable PDF Receipts**: Official receipt generated via `jsPDF` containing token, itemized prices, and verification status.
- **Suggestions & Feedback**: Submit food suggestions and canteen ratings with review status tracking.

### For Canteen Owner
- **One Master Owner Security Policy**: Public registration permanently disabled once master owner account is initialized.
- **Live Kitchen Orders Queue**: Real-time order dispatch with status advancement buttons and Socket.IO broadcast.
- **Cash Payment Counter Verification**: Verify cash receipt at pickup, updating DynamoDB and student UI in real time.
- **Complete Menu CRUD Interface**: Add, edit, delete food items, toggle stock availability, and upload images.
- **Operational Settings**: Manage canteen hours, emergency closure toggle, and broadcast announcement banners.
- **Real DynamoDB Analytics**: Verified daily revenue (excludes unpaid cash), active tokens, and top-selling dishes.
- **Student Information**: Directory of registered students and their order volume.

---

## ☁️ AWS Cloud Architecture

| AWS Service | Role in CampusBite |
| :--- | :--- |
| **Amazon EC2 & VPC** | Hosts the Node.js/Express REST API and Socket.IO WebSocket server. |
| **Amazon DynamoDB** | Primary and only database; stores users, menu, orders, tokens, payments, settings. |
| **Amazon S3** | Stores uploaded menu images and archived receipts. |
| **Amazon Cognito** | Authenticates students and verifies Owner JWT token claims. |
| **AWS Lambda** | Asynchronous background order notification processing. |
| **Amazon CloudWatch**| Application log streaming, metric collection, and performance alarms. |
| **AWS IAM** | Least-privilege IAM instance profile policies. |

---

## 📁 Repository Structure

```
MiniProject/
├── backend/
│   ├── aws/
│   │   ├── cloudwatch/          # Dashboard & Alarm definitions
│   │   ├── iam/                 # Least-privilege IAM policies
│   │   └── lambda/              # Order notification Lambda handler
│   ├── src/
│   │   ├── config/              # AWS & environment parameters
│   │   ├── controllers/         # Auth, Menu, Order, Payment, Admin controllers
│   │   ├── middleware/          # JWT/Cognito RBAC, logger, error handlers
│   │   ├── repositories/        # DynamoDB DocumentClient & data access layer
│   │   ├── routes/              # Express REST routes
│   │   ├── scripts/             # Seed data, table creation, owner reset CLI
│   │   ├── services/            # Socket.IO & Lambda notifier services
│   │   ├── app.js               # Express application
│   │   └── server.js            # HTTP & WebSocket entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Footer, FoodCard, Tracker, Modals
│   │   ├── context/             # AuthContext, CartContext
│   │   ├── layouts/             # StudentLayout, OwnerLayout
│   │   ├── pages/               # Student & Owner screens
│   │   ├── services/            # API client, Socket.io, jsPDF generator
│   │   ├── App.jsx              # Client routing
│   │   ├── index.css            # Master design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── AWS_ARCHITECTURE.md      # Detailed AWS cloud architecture
│   ├── DYNAMODB_SCHEMA.md       # DynamoDB table schema & access patterns
│   ├── SETUP_GUIDE.md           # Local & AWS setup instructions
│   └── FACULTY_DEMO_GUIDE.md    # Step-by-step presentation script for faculty
└── README.md
```

---

## ⚡ Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm run seed       # Seeds 28 authentic menu items
npm run dev        # Runs on http://localhost:5050
```

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:5175
```

### 3. Initialize Master Owner Account
Visit: **`http://localhost:5175/owner/setup`**

### 4. Faculty Demonstration
Follow the step-by-step presentation script in [`docs/FACULTY_DEMO_GUIDE.md`](./docs/FACULTY_DEMO_GUIDE.md).
