# CampusBite — Faculty Demonstration Guide & Project Walkthrough

**Subject:** Cloud Computing Lab (CCL) Mini-Project  
**Application:** CampusBite — Cloud-Based Canteen Pre-Order & Token Management System  
**Tagline:** Order Smart. Skip the Queue.  

---

## 1. Executive Summary for Evaluators

CampusBite is a functional full-stack cloud-native web application designed to solve canteen congestion, queue delays, and cash reconciliation issues in college environments.

### Core Architectural Features:
1. **Frontend**: React.js with Vite, styled with a custom vanilla CSS design system (Forest Green `#174C3C`, Fresh Green `#267653`, Warm Orange `#F4A340`, Cream `#FAF8F2`).
2. **Backend**: Node.js & Express REST APIs + persistent Socket.IO WebSocket server.
3. **Primary Database**: Amazon DynamoDB using AWS SDK for JavaScript v3 with atomic sequence counters and secondary indexes.
4. **Cloud Integration Readiness**:
   - **Amazon EC2 & VPC**: Node.js backend hosted with least-privilege security groups and health-check monitoring.
   - **Amazon DynamoDB**: On-Demand single and multi-table key-value storage.
   - **Amazon S3**: Food image asset storage with presigned URLs.
   - **Amazon Cognito**: JWT token verification and user role enforcement.
   - **AWS Lambda**: Asynchronous order notification dispatch.
   - **Amazon CloudWatch**: Centralized structured logging with credential redaction.
   - **AWS IAM**: Least-privilege instance profile policies.

---

## 2. Step-by-Step Live Demonstration Script

To deliver the best demonstration to your faculty, open **two browser windows** side-by-side:
- **Window 1 (Left)**: Student Portal (`http://localhost:5175/`)
- **Window 2 (Right)**: Owner Administrative Portal (`http://localhost:5175/owner/dashboard`)

---

### Step 1: Landing Page & Canteen Status
1. Navigate to `http://localhost:5175/`.
2. **Explain to Faculty**:
   - Point out the branding, hero banner, canteen operating hours, and how the page dynamically reads announcements from DynamoDB (`CampusBite_Settings`).
   - Show the 4-step workflow: Explore Menu -> Place Order -> Track Live Token -> Pickup & Receipt.
   - Scroll down to show the **Academic Specifications** and **Popular Canteen Picks**.

---

### Step 2: Student Registration & Authentication
1. Click **Student Sign In** -> **Register your student account** (or visit `http://localhost:5175/register`).
2. Register a new student:
   - **Full Name**: `Ananya Rao`
   - **College Email**: `ananya.rao@college.edu`
   - **Student Roll / ID**: `CS2026-108`
   - **Password**: `Student@123`
3. Click **Create Student Account**.
4. **Explain to Faculty**:
   - Passwords are encrypted on the backend with `bcryptjs` (salt rounds: 10).
   - The backend signs a JWT token containing `userId`, `email`, and `role: STUDENT`.
   - The token is verified on every subsequent API request through the `auth.js` middleware.

---

### Step 3: Menu Browsing & Cart Management
1. After login, navigate to `http://localhost:5175/menu`.
2. Demonstrate:
   - Category filtering: Click **BREAKFAST**, **LUNCH**, **FAST FOOD**, **CHAAT**, **BEVERAGES**, **DESSERTS**.
   - Search: Type `Dosa` or `Thali` in the search bar to show real-time filtering.
   - Sorting: Sort by **Price: Low to High** and **Fastest Preparation Time**.
3. Add items to cart:
   - Click **Add** on `Masala Dosa` (₹60).
   - Click **Add** on `Cold Coffee` (₹50).
   - Use the `+` / `-` buttons on the card to increase `Cold Coffee` quantity to 2.
4. Notice the floating bottom cart drawer updating dynamically: **3 items • ₹160**.
5. Click **Review & Checkout** to view `http://localhost:5175/cart`.

---

### Step 4: Simulated Payment & Concurrency-Safe Token Generation
1. In the Cart, click **Proceed to Checkout** (`http://localhost:5175/checkout`).
2. **Explain to Faculty**:
   - Review student details (Name, Roll ID, College Email).
   - Explain the 4 payment choices:
     - **UPI**: Google Pay / PhonePe simulation.
     - **Credit Card**: Demo 16-digit card simulation.
     - **Debit Card**: ATM/RuPay simulation.
     - **Cash at Counter**: Generates order with `PENDING` payment status.
   - Show the prominent **"DEMO / SIMULATED PAYMENT"** transparency badges.
   - Highlight **Idempotency Protection**: A unique client key is sent to prevent double-charging on network retries.
3. Select **UPI** and click **Pay ₹160 (UPI)**.
4. In the UPI modal, choose `student@okaxis` and click **Confirm Demo Payment**.

---

### Step 5: Order Confirmation & Downloadable PDF Receipt
1. The app immediately redirects to the **Order Confirmation Screen** (`/orders/confirmed/ord_...`).
2. **Explain to Faculty**:
   - Show the large **Pickup Token Number** (e.g., `CB-101`).
   - Explain that token numbers are **generated on the backend** using DynamoDB's atomic `ADD currentSequence :inc` command on the `CampusBite_Tokens` table — preventing duplicate tokens even during simultaneous orders.
3. Click **Download Receipt PDF**:
   - A beautifully styled PDF receipt downloads instantly (`CampusBite_Receipt_CB-101_ord_...pdf`).
   - Open the PDF and show the evaluators:
     - CampusBite branding and logo styling in Forest Green.
     - Token number, Order ID, Date/Time.
     - Itemized table with quantities, unit prices, and grand total.
     - Verified payment status stamp.

---

### Step 6: Real-Time Live Order Tracking (Socket.IO Demonstration)
1. In the Student window, click **Track Live Order** (`/orders/track/ord_...`).
2. Show the visual stepper in `ORDER_CONFIRMED` status with a green **LIVE WEBSOCKET** indicator.
3. Now switch to the **Owner Window (Right)**:
   - Navigate to `/owner/live-orders`.
   - The newly placed order (`Token #CB-101`) appears in the Kitchen Queue!
4. As the Owner:
   - Click **Start Preparing**:
     - The status moves to `PREPARING` in DynamoDB.
     - **Instantly, without refreshing**, watch the Student window's tracker progress to **Preparing Meal**!
   - Click **Ready for Pickup**:
     - The status updates to `READY_FOR_PICKUP`.
     - In the Student window, the green alert banner lights up with an animated pulse: *"Your Food is Ready! Present Token #CB-101 at the counter"*.
   - Click **Mark Collected**:
     - The order completes.

---

### Step 7: Cash Verification Workflow
1. In the Student window, place a new order selecting **Cash at Canteen Counter**.
2. Notice the order is created with status `ORDER_CONFIRMED` and payment status `PENDING`.
3. In the Owner window (`/owner/payments` or `/owner/live-orders`):
   - Notice the pending cash order is clearly highlighted.
   - Today's verified revenue excludes pending cash (preventing false financial reporting).
   - Click **Verify Cash Received**:
     - The backend records the payment verification timestamp and owner ID.
     - The payment status transitions to `PAID` in DynamoDB and updates the student's screen in real-time!

---

### Step 8: Menu Management CRUD & AWS S3 Image Upload
1. In Owner portal, navigate to `/owner/menu`.
2. Click **Add New Food Item**:
   - **Name**: `Paneer Kathi Roll`
   - **Category**: `FAST FOOD`
   - **Price**: `85`
   - **Prep Time**: `10`
   - Upload an image or enter a URL.
3. Click **Add to Menu**:
   - It appears immediately on the Student menu!
4. Show the **In Stock / Sold Out** toggle switch:
   - Toggling an item to "Sold Out" disables the Add to Cart button for students.

---

### Step 9: Owner Analytics & Genuine DynamoDB Statistics
1. In Owner portal, navigate to `/owner/dashboard`.
2. Show the evaluator the live KPIs:
   - **Today's Revenue**: Calculated only from verified paid orders.
   - **Active Tokens Queue**: Real count of orders currently preparing.
   - **Today's Orders & All-Time Orders**: Retrieved from DynamoDB.
   - **Top Selling Food Items**: Aggregated from item snapshots.

---

### Step 10: Backend Health Check & Monitoring
1. In a browser tab, open `http://localhost:5050/api/health`.
2. Show the JSON response containing:
   - `status: HEALTHY`
   - `service: CampusBite Backend API`
   - `uptime: ...`
   - `aws.region: us-east-1`
   - `aws.dynamoDbMode: ...`
   - `aws.lambdaFunction: CampusBite_OrderNotification`
   - Memory usage and Node version.
3. Show the IAM policy in `backend/aws/iam/ec2-instance-role-policy.json` demonstrating least privilege.

---

## 3. Frequently Asked Questions by Faculty

**Q: Why use Amazon DynamoDB instead of MySQL or MongoDB?**  
*A: In a college canteen rush, orders spike dramatically during short 15-minute breaks. DynamoDB's On-Demand scaling (`PAY_PER_REQUEST`) handles bursts of concurrent order writes without database connection pool exhaustion, while its atomic counter operations guarantee zero token collisions.*

**Q: How does the application prevent duplicate orders or double payments?**  
*A: We implement idempotency handling using a unique client idempotency key (`cb_idemp_<userId>_<timestamp>`). If a request is retried due to a network timeout, the backend recognizes the key in DynamoDB and returns the existing order rather than creating a duplicate.*

**Q: Where does AWS Lambda fit into the architecture?**  
*A: When a student places an order, the Express backend must respond in under 100ms. We offload non-critical background processing (formatting notifications, preparing alerts, recording CloudWatch metrics) to AWS Lambda (`CampusBite_OrderNotification`) via asynchronous invocation (`InvocationType: 'Event'`).*

**Q: How are Owner accounts protected?**  
*A: Security policy strictly enforces exactly ONE Master Owner account. The `/owner/setup` route is locked once an owner exists. Owner APIs require the `OWNER` role encoded in cryptographically signed tokens.*
