/**
 * AWS Lambda Function: CampusBite_OrderNotification
 * Runtime: Node.js 20.x or 22.x
 * 
 * Processes background order events triggered by the Express backend on EC2.
 * Prepares notifications, logs CloudWatch metrics, and formats alert messages.
 */

export const handler = async (event) => {
  console.log('--- CampusBite Order Notification Lambda Started ---');
  console.log('Received Event:', JSON.stringify(event, null, 2));

  try {
    const { 
      eventType, 
      orderId, 
      tokenNumber, 
      studentName, 
      studentEmail, 
      totalAmount, 
      paymentMethod,
      timestamp 
    } = event;

    if (!orderId || !tokenNumber) {
      console.error('Validation Error: Missing orderId or tokenNumber in event payload');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid payload: orderId and tokenNumber are required' })
      };
    }

    // Prepare simulated notification payload
    const notificationSummary = {
      recipient: studentEmail || 'student@college.edu',
      subject: `CampusBite Order Confirmed: Token ${tokenNumber}`,
      body: `Hi ${studentName || 'Student'}, your order #${orderId} of INR ${totalAmount} has been received. Your pickup token is ${tokenNumber}. Track live status on CampusBite.`,
      dispatchedAt: new Date().toISOString(),
      sourceEventTime: timestamp
    };

    console.log('[Notification Dispatch Simulation]', JSON.stringify(notificationSummary, null, 2));

    // In a complete AWS environment with SNS/SES configured,
    // you would invoke PublishCommand(SNS) or SendEmailCommand(SES) here.

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification successfully processed by Lambda',
        orderId,
        tokenNumber,
        status: 'PROCESSED'
      })
    };
  } catch (err) {
    console.error('Lambda Execution Error:', err);
    throw err;
  }
};
