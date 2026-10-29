import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5050/api';

test('Admin Analytics & Financial Reports API Suite', async (t) => {
  const timestamp = Date.now();
  const ownerEmail = `analytics_owner_${timestamp}@campusbite.internal`;
  const password = 'Password@123';

  // 1. Register and login owner
  const ownerRegRes = await fetch(`${BASE_URL}/auth/owner/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Analytics Test Owner',
      email: ownerEmail,
      canteenName: 'Analytics Kitchen',
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

  // 2. Fetch Analytics
  const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  assert.equal(analyticsRes.status, 200, 'Analytics endpoint reachable');
  const analyticsData = await analyticsRes.json();

  assert.equal(analyticsData.success, true);
  assert.ok(analyticsData.analytics, 'Analytics object exists');
  assert.ok(analyticsData.analytics.metrics, 'Metrics exist');
  assert.ok(Array.isArray(analyticsData.analytics.dailyTrends), 'Daily trends array exists');
  assert.ok(Array.isArray(analyticsData.analytics.hourlyDistribution), 'Hourly distribution exists');
  assert.ok(Array.isArray(analyticsData.analytics.mealSlots), 'Meal slots exist');
  assert.ok(analyticsData.analytics.paymentBreakdown, 'Payment breakdown exists');
  assert.ok(analyticsData.analytics.statusBreakdown, 'Status breakdown exists');
  assert.ok(Array.isArray(analyticsData.analytics.topSellingItems), 'Top selling items exists');

  // Verify metric fields
  const m = analyticsData.analytics.metrics;
  assert.equal(typeof m.totalOrders, 'number');
  assert.equal(typeof m.totalRevenue, 'number');
  assert.equal(typeof m.averageOrderValue, 'number');
  assert.equal(typeof m.fulfillmentRate, 'number');

  // Verify payment breakdown fields
  const pb = analyticsData.analytics.paymentBreakdown;
  assert.ok(pb.UPI && typeof pb.UPI.revenue === 'number');
  assert.ok(pb.CASH && typeof pb.CASH.revenue === 'number');

  // 3. Unauthorized access check (without token or with student token)
  const unauthRes = await fetch(`${BASE_URL}/admin/analytics`);
  assert.equal(unauthRes.status, 401, 'Unauthorized request rejected');

  console.log('✓ Admin analytics endpoint verification passed');
});
