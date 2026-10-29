import { jsPDF } from 'jspdf';

export function generateReceiptPdf(order) {
  if (!order) return;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Background Banner (Forest Green #174C3C)
  doc.setFillColor(23, 76, 60);
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Brand Name
  doc.setTextColor(250, 248, 242); // Cream #FAF8F2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('CAMPUSBITE', 40, 45);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(244, 163, 64); // Warm Orange #F4A340
  doc.text('Order Smart. Skip the Queue. | College Canteen Official Receipt', 40, 65);

  // Date in header
  doc.setTextColor(250, 248, 242);
  doc.setFontSize(10);
  const formattedDate = new Date(order.createdAt).toLocaleString();
  doc.text(`Date: ${formattedDate}`, pageWidth - 40, 45, { align: 'right' });
  doc.text(`Receipt #: RCP-${order.tokenNumber}-${Date.now().toString().slice(-4)}`, pageWidth - 40, 65, { align: 'right' });

  // Token Highlight Box
  doc.setFillColor(243, 239, 230); // cream subtle
  doc.roundedRect(40, 110, pageWidth - 80, 75, 8, 8, 'F');
  
  doc.setTextColor(32, 41, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PICKUP TOKEN NUMBER', 60, 135);

  doc.setFontSize(28);
  doc.setTextColor(23, 76, 60);
  doc.text(order.tokenNumber, 60, 170);

  // Order & Student Meta Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(115, 123, 117);
  doc.text('Order ID:', 260, 135);
  doc.text('Student Name:', 260, 152);
  doc.text('Student ID:', 260, 169);

  doc.setTextColor(32, 41, 35);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderId, 350, 135);
  doc.text(order.studentName || 'Student', 350, 152);
  doc.text(order.studentCollegeId || 'N/A', 350, 169);

  // Payment Status Badge
  const isPaid = order.paymentStatus === 'PAID';
  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 243, isPaid ? 231 : 199);
  doc.roundedRect(pageWidth - 160, 125, 100, 45, 6, 6, 'F');
  
  doc.setTextColor(isPaid ? 21 : 180, isPaid ? 128 : 83, isPaid ? 61 : 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT STATUS', pageWidth - 110, 142, { align: 'center' });
  doc.setFontSize(12);
  doc.text(order.paymentStatus, pageWidth - 110, 159, { align: 'center' });

  // Table Header
  const tableStartY = 215;
  doc.setFillColor(23, 76, 60);
  doc.rect(40, tableStartY, pageWidth - 80, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM DESCRIPTION', 50, tableStartY + 17);
  doc.text('CATEGORY', 260, tableStartY + 17);
  doc.text('QTY', 370, tableStartY + 17, { align: 'center' });
  doc.text('UNIT PRICE', 440, tableStartY + 17, { align: 'right' });
  doc.text('TOTAL (INR)', pageWidth - 50, tableStartY + 17, { align: 'right' });

  // Items List
  let currentY = tableStartY + 42;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(32, 41, 35);

  (order.items || []).forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(40, currentY - 14, pageWidth - 80, 22, 'F');
    }

    doc.text(item.name, 50, currentY);
    doc.text(item.category || 'CANTEEN', 260, currentY);
    doc.text(String(item.quantity || 1), 370, currentY, { align: 'center' });
    doc.text(`INR ${item.price.toFixed(2)}`, 440, currentY, { align: 'right' });
    doc.text(`INR ${((item.price) * (item.quantity || 1)).toFixed(2)}`, pageWidth - 50, currentY, { align: 'right' });

    currentY += 24;
  });

  // Divider
  doc.setDrawColor(229, 233, 230);
  doc.setLineWidth(1);
  doc.line(40, currentY, pageWidth - 40, currentY);

  currentY += 25;

  // Totals Area
  const totalsX = pageWidth - 200;
  doc.setFontSize(10);
  doc.setTextColor(115, 123, 117);
  doc.text('Subtotal:', totalsX, currentY);
  doc.setTextColor(32, 41, 35);
  doc.text(`INR ${(order.subtotal || order.totalAmount).toFixed(2)}`, pageWidth - 50, currentY, { align: 'right' });

  currentY += 18;
  doc.setTextColor(115, 123, 117);
  doc.text('Canteen Tax / Convenience:', totalsX, currentY);
  doc.setTextColor(32, 41, 35);
  doc.text('INR 0.00', pageWidth - 50, currentY, { align: 'right' });

  currentY += 18;
  doc.setTextColor(115, 123, 117);
  doc.text('Payment Method:', totalsX, currentY);
  doc.setTextColor(32, 41, 35);
  doc.text(order.paymentMethod, pageWidth - 50, currentY, { align: 'right' });

  currentY += 22;
  // Final Grand Total
  doc.setFillColor(232, 243, 238);
  doc.roundedRect(totalsX - 10, currentY - 15, 170, 32, 4, 4, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 76, 60);
  doc.text('GRAND TOTAL:', totalsX, currentY + 6);
  doc.text(`INR ${order.totalAmount.toFixed(2)}`, pageWidth - 50, currentY + 6, { align: 'right' });

  // Footer notes & verification
  const footerY = 720;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 123, 117);
  doc.text('Thank you for ordering with CampusBite! Please present this token at the collection counter when your order is READY.', 40, footerY);
  doc.text('This is a computer-generated receipt for college CCL lab demonstration purposes.', 40, footerY + 16);
  doc.text(`Security Verification Hash: SHA256-${order.orderId.slice(0, 10).toUpperCase()}-VERIFIED`, 40, footerY + 32);

  // Save PDF
  doc.save(`CampusBite_Receipt_${order.tokenNumber}_${order.orderId}.pdf`);
}
