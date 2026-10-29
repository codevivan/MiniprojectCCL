# Amazon DynamoDB Schema & Query Pattern Design

Amazon DynamoDB is the primary and only application database for CampusBite. The schema is designed around specific access patterns using partition keys, sort keys, and Global Secondary Indexes (GSIs).

---

## 1. Table Definitions

### 1. `CampusBite_Users`
Stores student accounts and the single master canteen owner account.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`userId`** | String (S) | **Partition Key (PK)** | Unique ID (e.g., `usr_a1b2c3d4e5f6`) |
| `email` | String (S) | GSI Hash Key | Normalized lowercase email address |
| `name` | String (S) | - | Student or Owner full name |
| `studentId` | String (S) | - | College Roll / Student ID |
| `role` | String (S) | - | `STUDENT` or `OWNER` |
| `passwordHash` | String (S) | - | Bcrypt hashed password |
| `status` | String (S) | - | `ACTIVE` |
| `createdAt` | String (S) | - | ISO-8601 creation timestamp |
| `updatedAt` | String (S) | - | ISO-8601 update timestamp |

**Global Secondary Indexes (GSIs):**
- **`EmailIndex`**: Partition Key: `email` (S). Used for fast login lookup `Query(email = :e)`.

---

### 2. `CampusBite_Menu`
Stores all canteen food items across categories.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`itemId`** | String (S) | **Partition Key (PK)** | Unique Item ID (e.g., `item_bf_dosa`) |
| `name` | String (S) | - | Food name (e.g., `Masala Dosa`) |
| `description` | String (S) | - | Culinary description & ingredients |
| `category` | String (S) | - | `BREAKFAST`, `LUNCH`, `FAST FOOD`, etc. |
| `price` | Number (N) | - | Price in Indian Rupees (INR) |
| `imageUrl` | String (S) | - | Image URL or S3 object key |
| `isAvailable` | Boolean (BOOL) | - | `true` (in stock) or `false` (sold out) |
| `prepTimeMinutes`| Number (N) | - | Estimated preparation time in minutes |
| `createdAt` | String (S) | - | ISO-8601 timestamp |
| `updatedAt` | String (S) | - | ISO-8601 timestamp |

---

### 3. `CampusBite_Orders`
Stores placed canteen orders, item snapshots, and live lifecycle states.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`orderId`** | String (S) | **Partition Key (PK)** | Unique Order ID (e.g., `ord_9f8e7d6c`) |
| `tokenNumber` | String (S) | - | Unique daily queue token (e.g., `CB-101`) |
| `studentId` | String (S) | GSI Hash Key | Reference to student `userId` |
| `studentName` | String (S) | - | Student display name snapshot |
| `studentEmail` | String (S) | - | Student email snapshot |
| `studentCollegeId`| String (S) | - | Student roll number snapshot |
| `items` | List (L) | - | Array of item objects with prices & quantities |
| `subtotal` | Number (N) | - | Authoritative backend calculated subtotal |
| `totalAmount` | Number (N) | - | Final grand total amount |
| `paymentMethod`| String (S) | - | `UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH` |
| `paymentStatus`| String (S) | - | `PAID`, `PENDING`, `FAILED` |
| `orderStatus` | String (S) | GSI Hash Key | `ORDER_CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED` |
| `paymentReference`| String (S) | - | Simulated transaction ref |
| `idempotencyKey`| String (S) | - | Client idempotency key preventing duplicate orders |
| `createdAt` | String (S) | GSI Range Key | ISO-8601 order creation timestamp |
| `updatedAt` | String (S) | - | ISO-8601 last update timestamp |

**Global Secondary Indexes (GSIs):**
- **`StudentOrdersIndex`**: Partition Key: `studentId` (S), Sort Key: `createdAt` (S). Used for fast reverse-chronological retrieval of a student's own order history.
- **`StatusIndex`**: Partition Key: `orderStatus` (S), Sort Key: `createdAt` (S). Used by Owner Dashboard to load active orders without scanning the entire table.

---

### 4. `CampusBite_Tokens`
Maintains concurrency-safe daily token sequences.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`tokenDate`** | String (S) | **Partition Key (PK)** | Current calendar date (`YYYY-MM-DD`) |
| `currentSequence`| Number (N) | - | Atomic sequential counter (starts at 101) |
| `updatedAt` | String (S) | - | ISO-8601 update timestamp |

**Atomic Counter Implementation**:
```javascript
const command = new UpdateCommand({
  TableName: 'CampusBite_Tokens',
  Key: { tokenDate: '2026-10-28' },
  UpdateExpression: 'ADD currentSequence :inc SET updatedAt = :u',
  ExpressionAttributeValues: { ':inc': 1, ':u': new Date().toISOString() },
  ReturnValues: 'UPDATED_NEW'
});
```

---

### 5. `CampusBite_Payments`
Persists verified payment audit records.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`paymentId`** | String (S) | **Partition Key (PK)** | Unique payment ID (e.g., `pay_...`) |
| `orderId` | String (S) | - | Associated Order ID |
| `tokenNumber` | String (S) | - | Associated Token Number |
| `studentId` | String (S) | - | Student ID |
| `amount` | Number (N) | - | Payment amount in INR |
| `paymentMethod`| String (S) | - | `UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH` |
| `paymentStatus`| String (S) | - | `PAID` or `PENDING` |
| `transactionRef`| String (S) | - | Demo reference or counter log |
| `verifiedBy` | String (S) | - | Owner email who verified cash receipt |
| `createdAt` | String (S) | - | ISO-8601 timestamp |

---

### 6. `CampusBite_Suggestions`
Stores student feedback and administrative reviews.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`suggestionId`**| String (S) | **Partition Key (PK)** | Unique ID (`sug_...`) |
| `studentId` | String (S) | - | Student user ID |
| `studentName` | String (S) | - | Student name |
| `category` | String (S) | - | Feedback category |
| `subject` | String (S) | - | Title/Subject |
| `description` | String (S) | - | Full feedback text |
| `rating` | Number (N) | - | 1 to 5 stars |
| `status` | String (S) | - | `NEW`, `REVIEWED`, `IMPLEMENTED` |
| `adminResponse`| String (S) | - | Public response from Canteen Owner |
| `createdAt` | String (S) | - | ISO-8601 timestamp |

---

### 7. `CampusBite_Settings`
Stores canteen opening hours, announcements, and operational toggles.

| Attribute Name | Data Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`settingKey`** | String (S) | **Partition Key (PK)** | Fixed key: `GENERAL_CONFIG` |
| `canteenName` | String (S) | - | Canteen display title |
| `openingHours` | String (S) | - | Operational hours |
| `announcement` | String (S) | - | Live announcement banner |
| `isTemporarilyClosed` | Boolean (BOOL) | - | Emergency closure switch |
| `isOrderingAvailable` | Boolean (BOOL) | - | Pre-ordering enable/disable switch |
