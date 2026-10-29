import { orderRepo } from '../repositories/orderRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import { logger } from '../middleware/logger.js';

export const adminController = {
  /**
   * Owner Overview: Real DynamoDB-Backed Statistics
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await orderRepo.getDashboardStats();
      const studentCount = (await userRepo.listStudents()).length;

      return res.json({
        success: true,
        stats: {
          ...stats,
          registeredStudentsCount: studentCount
        }
      });
    } catch (err) {
      logger.error('Failed to load dashboard statistics:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to load dashboard statistics.' });
    }
  },

  /**
   * Owner: Live Active Orders Queue
   */
  async getActiveOrders(req, res) {
    try {
      const activeOrders = await orderRepo.getActiveOrders();
      return res.json({
        success: true,
        count: activeOrders.length,
        orders: activeOrders
      });
    } catch (err) {
      logger.error('Failed to load active orders:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to load active orders.' });
    }
  },

  /**
   * Owner: All Orders with Filters
   */
  async getAllOrders(req, res) {
    try {
      const { status, paymentStatus, date } = req.query;
      const orders = await orderRepo.getAllOrders({ status, paymentStatus, date });
      return res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err) {
      logger.error('Failed to load order history:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to load order history.' });
    }
  },

  /**
   * Owner: Student Information (Without private credentials)
   */
  async getStudents(req, res) {
    try {
      const students = await userRepo.listStudents();
      const allOrders = await orderRepo.getAllOrders();

      // Aggregate student order statistics safely
      const enriched = students.map(s => {
        const studentOrders = allOrders.filter(o => o.studentId === s.userId);
        const totalSpent = studentOrders
          .filter(o => o.paymentStatus === 'PAID')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const lastOrder = studentOrders.length > 0 ? studentOrders[0].createdAt : null;

        return {
          userId: s.userId,
          name: s.name,
          email: s.email,
          studentId: s.studentId,
          createdAt: s.createdAt,
          orderCount: studentOrders.length,
          totalSpent,
          lastOrder
        };
      });

      return res.json({
        success: true,
        count: enriched.length,
        students: enriched
      });
    } catch (err) {
      logger.error('Failed to load student profiles:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to load student list.' });
    }
  },

  /**
   * Owner: Comprehensive Analytics for Visual Dashboard & Reporting
   */
  async getAnalytics(req, res) {
    try {
      const allOrders = await orderRepo.getAllOrders();
      const students = await userRepo.listStudents();

      // 1. Core Financial & Order Metrics
      const totalOrders = allOrders.length;
      const paidOrders = allOrders.filter(o => o.paymentStatus === 'PAID');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
      
      const completedOrders = allOrders.filter(o => o.orderStatus === 'COMPLETED').length;
      const cancelledOrders = allOrders.filter(o => o.orderStatus === 'CANCELLED').length;
      const activeOrders = allOrders.filter(o => ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.orderStatus)).length;
      const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      const pendingCashOrders = allOrders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING');
      const pendingCashRevenue = pendingCashOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // 2. Daily Trends (Last 7 Days)
      const dailyTrendMap = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        dailyTrendMap[dateKey] = { date: dateKey, label: dayLabel, revenue: 0, orders: 0, completed: 0 };
      }

      for (const ord of allOrders) {
        const dateKey = (ord.createdAt || '').split('T')[0];
        if (dailyTrendMap[dateKey]) {
          dailyTrendMap[dateKey].orders += 1;
          if (ord.paymentStatus === 'PAID') {
            dailyTrendMap[dateKey].revenue += (ord.totalAmount || 0);
          }
          if (ord.orderStatus === 'COMPLETED') {
            dailyTrendMap[dateKey].completed += 1;
          }
        }
      }
      const dailyTrends = Object.values(dailyTrendMap);

      // 3. Hourly Rush Distribution (00 to 23 hours)
      const hourlyCounts = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`,
        orders: 0
      }));

      for (const ord of allOrders) {
        if (ord.createdAt) {
          const hour = new Date(ord.createdAt).getHours();
          if (hourlyCounts[hour]) {
            hourlyCounts[hour].orders += 1;
          }
        }
      }

      const mealSlots = [
        { slot: 'Breakfast (8 AM - 11 AM)', orders: hourlyCounts.slice(8, 11).reduce((s, h) => s + h.orders, 0) },
        { slot: 'Lunch Rush (11 AM - 2 PM)', orders: hourlyCounts.slice(11, 14).reduce((s, h) => s + h.orders, 0) },
        { slot: 'Afternoon / Tea (2 PM - 5 PM)', orders: hourlyCounts.slice(14, 17).reduce((s, h) => s + h.orders, 0) },
        { slot: 'Evening Snacks (5 PM - 8 PM)', orders: hourlyCounts.slice(17, 20).reduce((s, h) => s + h.orders, 0) },
        { slot: 'Late Orders (Other)', orders: Math.max(0, allOrders.length - hourlyCounts.slice(8, 20).reduce((s, h) => s + h.orders, 0)) }
      ];

      // 4. Payment Method Distribution
      const paymentBreakdown = {
        UPI: { count: 0, revenue: 0 },
        CREDIT_CARD: { count: 0, revenue: 0 },
        DEBIT_CARD: { count: 0, revenue: 0 },
        CASH: { count: 0, revenue: 0, pendingCount: 0, pendingRevenue: 0 }
      };

      for (const ord of allOrders) {
        const method = ord.paymentMethod || 'CASH';
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, revenue: 0 };
        }
        paymentBreakdown[method].count += 1;
        if (ord.paymentStatus === 'PAID') {
          paymentBreakdown[method].revenue += (ord.totalAmount || 0);
        } else if (method === 'CASH') {
          paymentBreakdown.CASH.pendingCount = (paymentBreakdown.CASH.pendingCount || 0) + 1;
          paymentBreakdown.CASH.pendingRevenue = (paymentBreakdown.CASH.pendingRevenue || 0) + (ord.totalAmount || 0);
        }
      }

      // 5. Order Status Distribution
      const statusBreakdown = {
        ORDER_CONFIRMED: allOrders.filter(o => o.orderStatus === 'ORDER_CONFIRMED').length,
        PREPARING: allOrders.filter(o => o.orderStatus === 'PREPARING').length,
        READY_FOR_PICKUP: allOrders.filter(o => o.orderStatus === 'READY_FOR_PICKUP').length,
        COMPLETED: completedOrders,
        CANCELLED: cancelledOrders
      };

      // 6. Top Selling Food Items & Category Breakdown
      const itemMap = {};
      const categoryMap = {};

      for (const ord of allOrders) {
        if (ord.orderStatus !== 'CANCELLED' && Array.isArray(ord.items)) {
          for (const it of ord.items) {
            if (!itemMap[it.name]) {
              itemMap[it.name] = { name: it.name, count: 0, revenue: 0, category: it.category || 'General' };
            }
            itemMap[it.name].count += it.quantity || 1;
            itemMap[it.name].revenue += (it.price || 0) * (it.quantity || 1);

            const cat = it.category || 'General';
            if (!categoryMap[cat]) {
              categoryMap[cat] = { category: cat, itemsSold: 0, revenue: 0 };
            }
            categoryMap[cat].itemsSold += it.quantity || 1;
            categoryMap[cat].revenue += (it.price || 0) * (it.quantity || 1);
          }
        }
      }

      const topSellingItems = Object.values(itemMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const categoryDistribution = Object.values(categoryMap)
        .sort((a, b) => b.revenue - a.revenue);

      return res.json({
        success: true,
        analytics: {
          metrics: {
            totalOrders,
            paidOrdersCount: paidOrders.length,
            totalRevenue,
            averageOrderValue,
            completedOrders,
            cancelledOrders,
            activeOrders,
            fulfillmentRate,
            pendingCashCount: pendingCashOrders.length,
            pendingCashRevenue,
            registeredStudents: students.length
          },
          dailyTrends,
          hourlyDistribution: hourlyCounts,
          mealSlots,
          paymentBreakdown,
          statusBreakdown,
          topSellingItems,
          categoryDistribution
        }
      });
    } catch (err) {
      logger.error('Failed to compute analytics:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to compute analytics.' });
    }
  }
};
