import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5050/api';

test('Token Queue and Status Dropdown Real-Time Sync Flow', async (t) => {
  const timestamp = Date.now();
  const studentEmail = `queue_student_${timestamp}@college.edu`;
  const ownerEmail = `queue_owner_${timestamp}@campusbite.internal`;
  const password = 'Password@123';

  // 1. Register and login student
  const studentRegRes = await fetch(`${BASE_URL}/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Queue Test Student',
      email: studentEmail,
      studentId: `CS-${timestamp.toString().slice(-4)}`,
      password,
      confirmPassword: password
    })
  });
  assert.equal(studentRegRes.status, 201, 'Student registered');

  const studentLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password })
  });
  const studentLogin = await studentLoginRes.json();
  assert.equal(studentLoginRes.status, 200, 'Student logged in');
  const studentToken = studentLogin.token;

  // 2. Register and login owner
  const ownerRegRes = await fetch(`${BASE_URL}/auth/owner/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Queue Test Owner',
      email: ownerEmail,
      canteenName: 'CampusBite Central Kitchen',
      password,
      confirmPassword: password
    })
  });
  assert.equal(ownerRegRes.status, 201, 'Owner registered');

  const ownerLoginRes = await fetch(`${BASE_URL}/auth/owner/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password })
  });
  const ownerLogin = await ownerLoginRes.json();
  assert.equal(ownerLoginRes.status, 200, 'Owner logged in');
  const ownerToken = ownerLogin.token;

  // 3. Get a menu item to order
  const menuRes = await fetch(`${BASE_URL}/menu`);
  const menuData = await menuRes.json();
  assert.ok(menuData.items.length > 0, 'Menu has items');
  const testItem = menuData.items[0];

  // 4. Student places an order to receive a token
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      items: [{ itemId: testItem.itemId, quantity: 2 }],
      paymentMethod: 'UPI',
      paymentDetails: { upiId: 'student@okbank' },
      idempotencyKey: `idem_queue_${timestamp}`
    })
  });
  const orderData = await orderRes.json();
  assert.equal(orderRes.status, 201, 'Order created successfully');
  assert.ok(orderData.order.tokenNumber, 'Token number generated');
  const createdOrderId = orderData.order.orderId;
  const tokenNumber = orderData.order.tokenNumber;
  assert.equal(orderData.order.orderStatus, 'ORDER_CONFIRMED');

  // 5. Admin checks Active Orders Queue
  const activeOrdersRes = await fetch(`${BASE_URL}/admin/active-orders`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  const activeOrdersData = await activeOrdersRes.json();
  assert.equal(activeOrdersRes.status, 200, 'Admin can fetch active queue');
  const foundInQueue = activeOrdersData.orders.find(o => o.orderId === createdOrderId);
  assert.ok(foundInQueue, `Token ${tokenNumber} found in admin active queue`);
  assert.equal(foundInQueue.orderStatus, 'ORDER_CONFIRMED');

  // 6. Admin updates status via dropdown to PREPARING
  const prepRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ status: 'PREPARING' })
  });
  const prepData = await prepRes.json();
  assert.equal(prepRes.status, 200, 'Status updated to PREPARING');
  assert.equal(prepData.order.orderStatus, 'PREPARING');

  // 7. Verify student page gets updated state
  const studentCheck1 = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentCheck1Data = await studentCheck1.json();
  assert.equal(studentCheck1Data.order.orderStatus, 'PREPARING', 'Student sees PREPARING status');

  // 8. Admin updates status via dropdown to READY_FOR_PICKUP
  const readyRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ status: 'READY_FOR_PICKUP' })
  });
  const readyData = await readyRes.json();
  assert.equal(readyRes.status, 200, 'Status updated to READY_FOR_PICKUP');
  assert.equal(readyData.order.orderStatus, 'READY_FOR_PICKUP');

  // 9. Verify student sees READY_FOR_PICKUP
  const studentCheck2 = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentCheck2Data = await studentCheck2.json();
  assert.equal(studentCheck2Data.order.orderStatus, 'READY_FOR_PICKUP', 'Student sees READY_FOR_PICKUP');

  // 10. Admin marks order COMPLETED
  const compRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ status: 'COMPLETED' })
  });
  const compData = await compRes.json();
  assert.equal(compRes.status, 200, 'Status updated to COMPLETED');
  assert.equal(compData.order.orderStatus, 'COMPLETED');

  // 11. Verify student sees COMPLETED
  const studentCheck3 = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentCheck3Data = await studentCheck3.json();
  assert.equal(studentCheck3Data.order.orderStatus, 'COMPLETED', 'Student sees COMPLETED');

  console.log(`✓ All token queue and status dropdown transitions passed for Token ${tokenNumber}`);
});
