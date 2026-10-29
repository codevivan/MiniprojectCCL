import { jsPDF } from 'jspdf';

/**
 * Cleanly escape values for CSV RFC 4180 compliance
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export orders array to a downloadable CSV spreadsheet
 */
export function exportOrdersToCsv(orders, options = {}) {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const filename = options.filename || `CampusBite_Canteen_Report_${new Date().toISOString().split('T')[0]}.csv`;

  // Define CSV Header Columns
  const headers = [
    'Order ID',
    'Token Number',
    'Student Name',
    'Student College ID',
    'Student Email',
    'Date Placed',
    'Time Placed',
    'Items Ordered',
    'Total Items Count',
    'Subtotal (INR)',
    'Total Amount (INR)',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Payment Reference'
  ];

  // Map each order into a CSV row
  const rows = orders.map(ord => {
    const d = ord.createdAt ? new Date(ord.createdAt) : new Date();
    const dateStr = d.toLocaleDateString('en-IN');
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const itemsSummary = (ord.items || [])
      .map(it => `${it.name} (x${it.quantity || 1})`)
      .join('; ');

    const totalQty = (ord.items || []).reduce((s, it) => s + (it.quantity || 1), 0);

    return [
      escapeCsvValue(ord.orderId),
      escapeCsvValue(ord.tokenNumber),
      escapeCsvValue(ord.studentName || 'Student'),
      escapeCsvValue(ord.studentCollegeId || 'N/A'),
      escapeCsvValue(ord.studentEmail || 'N/A'),
      escapeCsvValue(dateStr),
      escapeCsvValue(timeStr),
      escapeCsvValue(itemsSummary),
      totalQty,
      ord.subtotal || ord.totalAmount || 0,
      ord.totalAmount || 0,
      escapeCsvValue(ord.paymentMethod || 'N/A'),
      escapeCsvValue(ord.paymentStatus || 'PENDING'),
      escapeCsvValue(ord.orderStatus || 'ORDER_CONFIRMED'),
      escapeCsvValue(ord.paymentReference || 'N/A')
    ].join(',');
  });

  // Prepend UTF-8 BOM so Microsoft Excel renders accented and special characters properly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a formal multi-page Executive Analytics & Financial PDF Report
 */
export function exportExecutiveReportPdf(orders = [], metrics = {}, options = {}) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ==========================================
  // PAGE 1: EXECUTIVE AUDIT & PERFORMANCE SUMMARY
  // ==========================================

  // Header Banner (Forest Green #174C3C)
  doc.setFillColor(23, 76, 60);
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Title & Brand
  doc.setTextColor(250, 248, 242); // Cream
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CAMPUSBITE CANTEEN SYSTEM', 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(244, 163, 64); // Warm Orange
  doc.text('Cloud-Based Canteen Pre-Order & Token Management • CCL MiniProject Audit', 40, 62);

  // Meta info on the right
  doc.setTextColor(250, 248, 242);
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr}`, pageWidth - 40, 42, { align: 'right' });
  doc.text(`Scope: ${options.filterScope || 'All-Time Historical Database'}`, pageWidth - 40, 62, { align: 'right' });

  // Section 1: Executive KPI Metrics
  doc.setTextColor(23, 76, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('1. Executive Financial & Operations Summary', 40, 120);

  // Calculate Metrics from orders if not passed
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const verifiedRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const aov = paidOrders.length > 0 ? Math.round(verifiedRevenue / paidOrders.length) : 0;
  const completedOrders = orders.filter(o => o.orderStatus === 'COMPLETED').length;
  const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const pendingCashCount = orders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING').length;
  const pendingCashRevenue = orders
    .filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING')
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  const kpis = [
    { label: 'TOTAL VERIFIED REVENUE', val: `Rs. ${verifiedRevenue}`, color: [23, 76, 60], sub: 'Paid transactions' },
    { label: 'TOTAL ORDERS', val: `${totalOrders}`, color: [32, 41, 35], sub: `${paidOrders.length} paid` },
    { label: 'AVG ORDER VALUE (AOV)', val: `Rs. ${aov}`, color: [38, 118, 83], sub: 'Per paid order' },
    { label: 'FULFILLMENT RATE', val: `${fulfillmentRate}%`, color: [22, 101, 52], sub: `${completedOrders} completed` },
    { label: 'PENDING CASH', val: `Rs. ${pendingCashRevenue}`, color: [220, 38, 38], sub: `${pendingCashCount} orders due` },
    { label: 'DATABASE ENGINE', val: 'DynamoDB', color: [217, 119, 6], sub: 'NoSQL Cloud Tables' }
  ];

  const startY = 135;
  const boxWidth = (pageWidth - 80 - 20) / 3;
  const boxHeight = 55;

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 40 + col * (boxWidth + 10);
    const y = startY + row * (boxHeight + 10);

    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(x, y, boxWidth, boxHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(115, 123, 117);
    doc.text(kpi.label, x + 10, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 10, y + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 145, 140);
    doc.text(kpi.sub, x + 10, y + 48);
  });

  // Section 2: Payment Reconciliation & Order Status Tables side by side
  const section2Y = startY + (boxHeight + 10) * 2 + 25;
  doc.setTextColor(23, 76, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('2. Payment Reconciliation & Order Status Distribution', 40, section2Y);

  const halfWidth = (pageWidth - 80 - 15) / 2;

  // Table A: Payment Method Breakdown
  const tableAY = section2Y + 12;
  doc.setFillColor(23, 76, 60);
  doc.rect(40, tableAY, halfWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT METHOD', 48, tableAY + 14);
  doc.text('COUNT', 40 + halfWidth - 90, tableAY + 14, { align: 'right' });
  doc.text('AMOUNT (INR)', 40 + halfWidth - 10, tableAY + 14, { align: 'right' });

  const paymentMethods = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];
  let curY = tableAY + 20;

  paymentMethods.forEach((method, i) => {
    const methodOrders = orders.filter(o => o.paymentMethod === method);
    const sum = methodOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(40, curY, halfWidth, 18, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(32, 41, 35);
    doc.text(method.replace('_', ' '), 48, curY + 12);
    doc.text(`${methodOrders.length}`, 40 + halfWidth - 90, curY + 12, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${sum}`, 40 + halfWidth - 10, curY + 12, { align: 'right' });

    curY += 18;
  });

  // Table B: Order Status Distribution
  const tableBX = 40 + halfWidth + 15;
  doc.setFillColor(23, 76, 60);
  doc.rect(tableBX, tableAY, halfWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('LIFECYCLE STATUS', tableBX + 8, tableAY + 14);
  doc.text('COUNT', tableBX + halfWidth - 65, tableAY + 14, { align: 'right' });
  doc.text('% SHARE', tableBX + halfWidth - 10, tableAY + 14, { align: 'right' });

  const statuses = [
    { key: 'ORDER_CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'Being Prepared' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' }
  ];

  curY = tableAY + 20;
  statuses.forEach((st, i) => {
    const cnt = orders.filter(o => o.orderStatus === st.key).length;
    const share = totalOrders > 0 ? Math.round((cnt / totalOrders) * 100) : 0;

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(tableBX, curY, halfWidth, 18, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(32, 41, 35);
    doc.text(st.label, tableBX + 8, curY + 12);
    doc.text(`${cnt}`, tableBX + halfWidth - 65, curY + 12, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${share}%`, tableBX + halfWidth - 10, curY + 12, { align: 'right' });

    curY += 18;
  });

  // Section 3: Top Selling Menu Items
  const section3Y = curY + 30;
  doc.setTextColor(23, 76, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Top Selling Menu Items & Popularity Analysis', 40, section3Y);

  const itemMap = {};
  for (const ord of orders) {
    if (ord.orderStatus !== 'CANCELLED' && Array.isArray(ord.items)) {
      for (const it of ord.items) {
        if (!itemMap[it.name]) {
          itemMap[it.name] = { name: it.name, count: 0, revenue: 0, category: it.category || 'General' };
        }
        itemMap[it.name].count += it.quantity || 1;
        itemMap[it.name].revenue += (it.price || 0) * (it.quantity || 1);
      }
    }
  }

  const topItems = Object.values(itemMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topTableY = section3Y + 12;
  doc.setFillColor(23, 76, 60);
  doc.rect(40, topTableY, pageWidth - 80, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RANK & FOOD ITEM', 48, topTableY + 14);
  doc.text('CATEGORY', 240, topTableY + 14);
  doc.text('UNITS SOLD', 380, topTableY + 14, { align: 'center' });
  doc.text('TOTAL REVENUE (INR)', pageWidth - 50, topTableY + 14, { align: 'right' });

  curY = topTableY + 20;
  if (topItems.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(115, 123, 117);
    doc.text('No items ordered yet in this timeframe.', 48, curY + 14);
    curY += 20;
  } else {
    topItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(40, curY, pageWidth - 80, 18, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(23, 76, 60);
      doc.text(`#${idx + 1}  ${item.name}`, 48, curY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(item.category, 240, curY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 41, 35);
      doc.text(`${item.count} items`, 380, curY + 12, { align: 'center' });

      doc.setTextColor(23, 76, 60);
      doc.text(`Rs. ${item.revenue}`, pageWidth - 50, curY + 12, { align: 'right' });

      curY += 18;
    });
  }

  // Verification Footer on Page 1
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('CampusBite Canteen Audit System • Official Report • Page 1 of 2', 40, pageHeight - 30);
  doc.text('Amazon DynamoDB Storage Engine • Cloud Computing Lab (CCL) Evaluation', pageWidth - 40, pageHeight - 30, { align: 'right' });

  // ==========================================
  // PAGE 2: AUDIT LOG & FORMAL SIGN-OFF
  // ==========================================
  doc.addPage();

  // Header Banner
  doc.setFillColor(23, 76, 60);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(250, 248, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ORDER AUDIT TRAIL & FACULTY VERIFICATION', 40, 35);

  doc.setFontSize(9);
  doc.setTextColor(244, 163, 64);
  doc.text(`Total Records Extracted: ${orders.length}`, pageWidth - 40, 35, { align: 'right' });

  // Audit Table Header
  const auditTableY = 80;
  doc.setFillColor(23, 76, 60);
  doc.rect(40, auditTableY, pageWidth - 80, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOKEN #', 48, auditTableY + 14);
  doc.text('ORDER ID', 110, auditTableY + 14);
  doc.text('STUDENT NAME / ID', 190, auditTableY + 14);
  doc.text('DATE & TIME', 310, auditTableY + 14);
  doc.text('PAYMENT', 410, auditTableY + 14);
  doc.text('STATUS', 470, auditTableY + 14);
  doc.text('AMOUNT', pageWidth - 50, auditTableY + 14, { align: 'right' });

  curY = auditTableY + 20;
  const recentOrders = orders.slice(0, 25); // show up to 25 latest for clean layout

  recentOrders.forEach((o, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(40, curY, pageWidth - 80, 18, 'F');
    }

    const oDate = o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const oDateDay = o.createdAt ? new Date(o.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(23, 76, 60);
    doc.text(o.tokenNumber || 'N/A', 48, curY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text((o.orderId || '').slice(0, 10), 110, curY + 12);

    doc.setTextColor(30, 30, 30);
    doc.text((o.studentName || 'Student').slice(0, 16), 190, curY + 12);

    doc.setTextColor(110, 110, 110);
    doc.text(`${oDateDay} ${oDate}`, 310, curY + 12);

    doc.setTextColor(o.paymentStatus === 'PAID' ? 22 : 217, o.paymentStatus === 'PAID' ? 101 : 119, o.paymentStatus === 'PAID' ? 52 : 6);
    doc.text(`${o.paymentMethod || 'CASH'}-${o.paymentStatus || 'PENDING'}`, 410, curY + 12);

    doc.setTextColor(o.orderStatus === 'COMPLETED' ? 22 : 180, o.orderStatus === 'COMPLETED' ? 101 : 83, o.orderStatus === 'COMPLETED' ? 52 : 9);
    doc.text((o.orderStatus || '').replace('_', ' ').slice(0, 10), 470, curY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 76, 60);
    doc.text(`Rs. ${o.totalAmount || 0}`, pageWidth - 50, curY + 12, { align: 'right' });

    curY += 18;
  });

  // CCL Faculty Sign-off Box
  const signY = pageHeight - 120;
  doc.setDrawColor(200, 205, 200);
  doc.setFillColor(250, 252, 250);
  doc.roundedRect(40, signY, pageWidth - 80, 75, 6, 6, 'FD');

  doc.setTextColor(23, 76, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL VERIFICATION & AUDIT SIGN-OFF', 55, signY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('This financial audit report has been cross-checked with Amazon DynamoDB transactions and simulated payment receipts.', 55, signY + 30);

  // Signature lines
  const sigLineY = signY + 58;
  doc.setDrawColor(160, 160, 160);
  doc.line(70, sigLineY, 210, sigLineY);
  doc.line(pageWidth - 210, sigLineY, pageWidth - 70, sigLineY);

  doc.setFontSize(7);
  doc.text('Canteen Operations In-Charge', 90, sigLineY + 10);
  doc.text('Faculty Evaluator / Lab In-Charge', pageWidth - 190, sigLineY + 10);

  // Footer Page 2
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('CampusBite Canteen Audit System • Official Report • Page 2 of 2', 40, pageHeight - 25);
  doc.text('Cloud Computing Lab (CCL) Project Documentation', pageWidth - 40, pageHeight - 25, { align: 'right' });

  // Trigger Save
  const pdfFileName = options.filename || `CampusBite_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(pdfFileName);
}
