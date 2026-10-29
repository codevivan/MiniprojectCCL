import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5050/api';

test('CampusBite Complete Authentication & RBAC Test Suite', async (t) => {
  const uniqueSuffix = Date.now();
  const studentEmail = `student.${uniqueSuffix}@college.edu`;
  const studentId = `CS-${uniqueSuffix.toString().slice(-4)}`;
  const studentPassword = 'StudentPassword@123';

  const ownerEmail = `owner.${uniqueSuffix}@college.edu`;
  const ownerPassword = 'OwnerPassword@2026';
  const canteenName = `Campus Canteen ${uniqueSuffix.toString().slice(-4)}`;

  let studentToken = null;
  let ownerToken = null;
  let createdOrderId = null;

  // Health Check
  await t.test('0. Health Check: Backend is running and DynamoDB is connected', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'HEALTHY');
    assert.equal(data.service, 'CampusBite Backend API');
  });

  // Scenario 1: Student creates account and logs in successfully
  await t.test('1. Scenario 1: Student creates an account and logs in successfully', async (st) => {
    // 1a. Register Student
    const regRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: studentEmail,
        studentId: studentId,
        password: studentPassword,
        confirmPassword: studentPassword
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.user.email, studentEmail.toLowerCase());
    assert.equal(regData.user.studentId, studentId);
    assert.equal(regData.user.role, 'STUDENT');

    // 1b. Login with registered email
    const loginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.ok(loginData.token);
    assert.equal(loginData.user.role, 'STUDENT');
    studentToken = loginData.token;

    // 1c. Login with Student ID instead of email
    const idLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentId,
        password: studentPassword
      })
    });
    assert.equal(idLoginRes.status, 200);
    const idLoginData = await idLoginRes.json();
    assert.equal(idLoginData.success, true);
    assert.ok(idLoginData.token);
  });

  // Scenario 2: Student logs out and logs in again
  await t.test('2. Scenario 2: Student logs out and logs in again', async () => {
    // Simulating logout on client: discarding studentToken
    studentToken = null;

    // Re-login
    const reLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });
    assert.equal(reLoginRes.status, 200);
    const reLoginData = await reLoginRes.json();
    assert.equal(reLoginData.success, true);
    studentToken = reLoginData.token;

    // Verify token validity via profile endpoint
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, studentEmail.toLowerCase());
    assert.equal(meData.user.role, 'STUDENT');
  });

  // Scenario: Owner registration input validation (password mismatch)
  await t.test('3. Owner registration validates input and rejects password mismatch', async () => {
    const unauthRes = await fetch(`${BASE_URL}/auth/owner/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Owner',
        canteenName: 'Test Canteen',
        email: `mismatch.${Date.now()}@college.edu`,
        password: 'Password@123',
        confirmPassword: 'DifferentPassword@123'
      })
    });
    assert.equal(unauthRes.status, 400);
    const unauthData = await unauthRes.json();
    assert.equal(unauthData.success, false);
    assert.match(unauthData.error, /Passwords do not match/i);
  });

  // Scenario 3: Owner completes registration and logs in successfully
  await t.test('4. Scenario 3: Owner completes registration and logs in', async () => {
    // 3a. Register without registration code
    const regRes = await fetch(`${BASE_URL}/auth/owner/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prof. Ramesh Hegde',
        canteenName: canteenName,
        email: ownerEmail,
        password: ownerPassword,
        confirmPassword: ownerPassword
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.user.email, ownerEmail.toLowerCase());
    assert.equal(regData.user.role, 'OWNER');

    // 3b. Log in with registered owner credentials
    const loginRes = await fetch(`${BASE_URL}/auth/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword
      })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.ok(loginData.token);
    assert.equal(loginData.user.role, 'OWNER');
    ownerToken = loginData.token;
  });

  // Scenario 4: Owner logs out and logs in again
  await t.test('5. Scenario 4: Owner logs out and logs in again', async () => {
    // Client drops token
    ownerToken = null;

    // Owner logs back in
    const reLoginRes = await fetch(`${BASE_URL}/auth/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword
      })
    });
    assert.equal(reLoginRes.status, 200);
    const reLoginData = await reLoginRes.json();
    assert.equal(reLoginData.success, true);
    ownerToken = reLoginData.token;

    // Verify session
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, ownerEmail.toLowerCase());
    assert.equal(meData.user.role, 'OWNER');
  });

  // Scenario 5: Invalid credentials are rejected
  await t.test('6. Scenario 5: Invalid credentials are rejected with clear messages', async () => {
    // 5a. Student wrong password
    const badPassRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'CompletelyWrongPassword'
      })
    });
    assert.equal(badPassRes.status, 401);
    const badPassData = await badPassRes.json();
    assert.match(badPassData.error, /Incorrect password/i);

    // 5b. Student non-existent user
    const badUserRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does.not.exist@college.edu',
        password: 'Password@123'
      })
    });
    assert.equal(badUserRes.status, 401);
    const badUserData = await badUserRes.json();
    assert.match(badUserData.error, /Account not found/i);

    // 5c. Owner wrong password
    const badOwnerPassRes = await fetch(`${BASE_URL}/auth/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: 'WrongOwnerPassword'
      })
    });
    assert.equal(badOwnerPassRes.status, 401);
    const badOwnerPassData = await badOwnerPassRes.json();
    assert.match(badOwnerPassData.error, /Incorrect password/i);
  });

  // Scenario 6: Duplicate registrations are rejected
  await t.test('7. Scenario 6: Duplicate registrations are rejected (HTTP 409)', async () => {
    // 6a. Duplicate Student Email
    const dupEmailRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: studentEmail,
        studentId: 'CS-DIFF-9999',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    assert.equal(dupEmailRes.status, 409);
    const dupEmailData = await dupEmailRes.json();
    assert.match(dupEmailData.error, /already exists/i);

    // 6b. Duplicate Student ID
    const dupIdRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: `different.${Date.now()}@college.edu`,
        studentId: studentId,
        password: 'Password@123',
        confirmPassword: 'Password@123'
      })
    });
    assert.equal(dupIdRes.status, 409);
    const dupIdData = await dupIdRes.json();
    assert.match(dupIdData.error, /already registered/i);

    // 6c. Duplicate Owner Email
    const dupOwnerRes = await fetch(`${BASE_URL}/auth/owner/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Owner',
        canteenName: 'Another Canteen',
        email: ownerEmail,
        password: 'Password@2026',
        confirmPassword: 'Password@2026'
      })
    });
    assert.equal(dupOwnerRes.status, 409);
  });

  // Scenario 8: Students cannot access Owner dashboards or APIs
  await t.test('8. Scenario 8: Role-based separation and student lockout from Owner APIs', async () => {
    // 8a. Student token accessing Owner Stats API
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert.equal(statsRes.status, 403);
    const statsData = await statsRes.json();
    assert.match(statsData.error, /Access Denied/i);

    // 8b. Student token attempting to create a menu item
    const menuCreateRes = await fetch(`${BASE_URL}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized Pizza',
        category: 'FAST FOOD',
        price: 99
      })
    });
    assert.equal(menuCreateRes.status, 403);

    // 8c. Student attempting to log into Owner Login portal
    const studentAsOwnerRes = await fetch(`${BASE_URL}/auth/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });
    assert.equal(studentAsOwnerRes.status, 403);
    const studentAsOwnerData = await studentAsOwnerRes.json();
    assert.match(studentAsOwnerData.error, /registered as a Student/i);

    // 8d. Owner attempting to log into Student Login portal
    const ownerAsStudentRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword
      })
    });
    assert.equal(ownerAsStudentRes.status, 403);
    const ownerAsStudentData = await ownerAsStudentRes.json();
    assert.match(ownerAsStudentData.error, /registered as a Canteen Owner/i);
  });

  // Scenario 9 & 10: Persistent database and complete pre-order flow
  await t.test('9. Scenario 9 & 10: Persistent database and complete pre-order & order advance flow', async () => {
    // 9a. Verify Owner can access Admin Stats
    const ownerStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    assert.equal(ownerStatsRes.status, 200);

    // 9b. Student fetches menu
    const menuRes = await fetch(`${BASE_URL}/menu`);
    assert.equal(menuRes.status, 200);
    const menuData = await menuRes.json();
    assert.ok(menuData.items.length > 0);
    const testItem = menuData.items[0];

    // 9c. Student creates order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: testItem.itemId, quantity: 2 }],
        paymentMethod: 'UPI',
        idempotencyKey: `idemp_${Date.now()}`,
        paymentDetails: { upiId: 'student@upi' }
      })
    });
    assert.equal(orderRes.status, 201);
    const orderData = await orderRes.json();
    assert.equal(orderData.success, true);
    assert.ok(orderData.order.tokenNumber.startsWith('CB-'));
    assert.equal(orderData.order.paymentStatus, 'PAID');
    assert.equal(orderData.order.orderStatus, 'ORDER_CONFIRMED');
    createdOrderId = orderData.order.orderId;

    // 9d. Owner advances status: CONFIRMED -> PREPARING
    const prepRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'PREPARING' })
    });
    assert.equal(prepRes.status, 200);
    const prepData = await prepRes.json();
    assert.equal(prepData.order.orderStatus, 'PREPARING');

    // 9e. Owner advances status: PREPARING -> READY_FOR_PICKUP
    const readyRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'READY_FOR_PICKUP' })
    });
    assert.equal(readyRes.status, 200);
    const readyData = await readyRes.json();
    assert.equal(readyData.order.orderStatus, 'READY_FOR_PICKUP');

    // 9f. Student can view their live order
    const getOrderRes = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert.equal(getOrderRes.status, 200);
    const getOrderData = await getOrderRes.json();
    assert.equal(getOrderData.order.orderStatus, 'READY_FOR_PICKUP');
  });
});
