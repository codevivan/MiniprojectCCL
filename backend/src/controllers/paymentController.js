import { paymentRepo } from '../repositories/paymentRepo.js';

export const paymentController = {
  async getPaymentHistory(req, res) {
    try {
      const { method, status } = req.query;
      const payments = await paymentRepo.getAll({ method, status });
      return res.json({
        success: true,
        count: payments.length,
        payments
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve payment history.' });
    }
  }
};
