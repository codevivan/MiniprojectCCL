import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { generateReceiptPdf } from '../../services/pdfGenerator';
import { exportOrdersToCsv, exportExecutiveReportPdf } from '../../services/reportExporter';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  RefreshCw, 
  FileText,
  Clock,
  PieChart,
  CheckCircle2,
  DollarSign,
  Flame,
  ArrowRight,
  Filter,
  CheckCheck
} from 'lucide-react';

export default function OwnerReports() {
  const [allOrders, setAllOrders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL', 'TODAY', '7DAYS', '30DAYS', 'CUSTOM'
  const [customDate, setCustomDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // 'ANALYTICS' or 'TABLE'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, analyticsRes] = await Promise.all([
        api.admin.getAllOrders(),
        api.admin.getAnalytics()
      ]);

      if (ordersRes.success && ordersRes.orders) {
        setAllOrders(ordersRes.orders);
      }
      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalyticsData(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('Failed to load reports and analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders according to user selection
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;

      // 2. Payment Filter
      if (paymentFilter !== 'ALL' && o.paymentStatus !== paymentFilter) return false;

      // 3. Date Filter Preset
      if (datePreset === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        return (o.createdAt || '').startsWith(todayStr);
      }

      if (datePreset === '7DAYS') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(o.createdAt) >= sevenDaysAgo;
      }

      if (datePreset === '30DAYS') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(o.createdAt) >= thirtyDaysAgo;
      }

      if (datePreset === 'CUSTOM' && customDate) {
        return (o.createdAt || '').startsWith(customDate);
      }

      return true;
    });
  }, [allOrders, statusFilter, paymentFilter, datePreset, customDate]);

  // Dynamic Metrics for the filtered slice
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
    const completedOrders = filteredOrders.filter(o => o.orderStatus === 'COMPLETED').length;
    const cancelledOrders = filteredOrders.filter(o => o.orderStatus === 'CANCELLED').length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const pendingCashRevenue = filteredOrders
      .filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Payment method breakdown for filtered slice
    const payments = {
      UPI: { count: 0, revenue: 0 },
      CARD: { count: 0, revenue: 0 },
      CASH: { count: 0, revenue: 0, pending: 0 }
    };

    filteredOrders.forEach(o => {
      const isCard = ['CREDIT_CARD', 'DEBIT_CARD'].includes(o.paymentMethod);
      const key = isCard ? 'CARD' : (o.paymentMethod === 'UPI' ? 'UPI' : 'CASH');

      payments[key].count += 1;
      if (o.paymentStatus === 'PAID') {
        payments[key].revenue += (o.totalAmount || 0);
      } else if (key === 'CASH') {
        payments.CASH.pending += (o.totalAmount || 0);
      }
    });

    // Top selling items in this slice
    const itemMap = {};
    filteredOrders.forEach(ord => {
      if (ord.orderStatus !== 'CANCELLED' && Array.isArray(ord.items)) {
        ord.items.forEach(it => {
          if (!itemMap[it.name]) {
            itemMap[it.name] = { name: it.name, count: 0, revenue: 0, category: it.category || 'Food' };
          }
          itemMap[it.name].count += it.quantity || 1;
          itemMap[it.name].revenue += (it.price || 0) * (it.quantity || 1);
        });
      }
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Peak Meal Slot Distribution
    const mealRush = {
      breakfast: 0,
      lunch: 0,
      afternoon: 0,
      evening: 0
    };

    filteredOrders.forEach(ord => {
      if (ord.createdAt) {
        const hour = new Date(ord.createdAt).getHours();
        if (hour >= 8 && hour < 11) mealRush.breakfast += 1;
        else if (hour >= 11 && hour < 14) mealRush.lunch += 1;
        else if (hour >= 14 && hour < 17) mealRush.afternoon += 1;
        else if (hour >= 17 && hour < 20) mealRush.evening += 1;
      }
    });

    return {
      totalOrders,
      paidOrdersCount: paidOrders.length,
      totalRevenue,
      averageOrderValue,
      completedOrders,
      cancelledOrders,
      fulfillmentRate,
      pendingCashRevenue,
      payments,
      topItems,
      mealRush
    };
  }, [filteredOrders]);

  // Handle CSV Export
  const handleDownloadCsv = () => {
    setExporting(true);
    try {
      const scopeLabel = datePreset === 'ALL' ? 'All_Time' : datePreset;
      exportOrdersToCsv(filteredOrders, {
        filename: `CampusBite_Canteen_Report_${scopeLabel}_${new Date().toISOString().split('T')[0]}.csv`
      });
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  // Handle PDF Export
  const handleDownloadPdf = () => {
    setExporting(true);
    try {
      const scopeLabel = datePreset === 'ALL' 
        ? 'All-Time Records' 
        : datePreset === 'TODAY' 
        ? "Today's Orders" 
        : datePreset === '7DAYS' 
        ? 'Last 7 Days' 
        : datePreset === '30DAYS' 
        ? 'Last 30 Days' 
        : `Date: ${customDate}`;

      exportExecutiveReportPdf(filteredOrders, metrics, {
        filterScope: scopeLabel,
        filename: `CampusBite_Financial_Audit_${new Date().toISOString().split('T')[0]}.pdf`
      });
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  // 7-day trend bars calculation
  const trendDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      const dayOrders = allOrders.filter(o => (o.createdAt || '').startsWith(dateKey));
      const dayRev = dayOrders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      days.push({
        date: dateKey,
        label: dayLabel,
        orders: dayOrders.length,
        revenue: dayRev
      });
    }
    return days;
  }, [allOrders]);

  const maxTrendRevenue = Math.max(...trendDays.map(d => d.revenue), 100);

  return (
    <div>
      {/* Top Header & Export Center */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CANTEEN BUSINESS INTELLIGENCE
          </span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)', marginTop: '2px' }}>
            Analytics & Financial Reports
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Real-time sales analytics, peak rush hour heatmaps, and downloadable audit reports.
          </p>
        </div>

        {/* Action Download Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={fetchData} 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh latest DynamoDB transactions"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          {/* Download CSV Spreadsheet Button */}
          <button 
            onClick={handleDownloadCsv}
            disabled={exporting || filteredOrders.length === 0}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', color: '#166534', border: '1.5px solid #BBF7D0', fontWeight: '700' }}
            title="Download formatted CSV spreadsheet for Excel"
          >
            <FileSpreadsheet size={15} color="#16A34A" />
            <span>Download CSV Report</span>
          </button>

          {/* Download Executive PDF Report Button */}
          <button 
            onClick={handleDownloadPdf}
            disabled={exporting || filteredOrders.length === 0}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            title="Download multi-page formal PDF audit report"
          >
            <FileText size={15} />
            <span>Download Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Date Presets & Filter Bar */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-muted)', marginRight: '4px' }}>
              Timeframe:
            </span>
            {[
              { key: 'ALL', label: 'All-Time' },
              { key: 'TODAY', label: 'Today' },
              { key: '7DAYS', label: 'Last 7 Days' },
              { key: '30DAYS', label: 'Last 30 Days' },
              { key: 'CUSTOM', label: 'Custom Date' }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setDatePreset(p.key);
                  if (p.key !== 'CUSTOM') setCustomDate('');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: datePreset === p.key ? '700' : '600',
                  backgroundColor: datePreset === p.key ? 'var(--color-forest)' : 'var(--color-cream)',
                  color: datePreset === p.key ? 'var(--color-white)' : 'var(--color-dark)',
                  border: `1.5px solid ${datePreset === p.key ? 'var(--color-forest)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Date Input */}
            {datePreset === 'CUSTOM' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                <Calendar size={15} color="var(--color-muted)" />
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Status & Payment Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="ORDER_CONFIRMED">🟡 Confirmed</option>
              <option value="PREPARING">👨‍🍳 Being Prepared</option>
              <option value="READY_FOR_PICKUP">🔔 Ready for Pickup</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="CANCELLED">❌ Cancelled</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 12px' }}
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="ALL">All Payment States</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>

            {(statusFilter !== 'ALL' || paymentFilter !== 'ALL' || datePreset !== 'ALL') && (
              <button
                onClick={() => {
                  setDatePreset('ALL');
                  setStatusFilter('ALL');
                  setPaymentFilter('ALL');
                  setCustomDate('');
                }}
                style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: '700', textDecoration: 'underline' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Financial Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Verified Revenue */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: '600' }}>Verified Revenue</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
            ₹{metrics.totalRevenue}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: '600', marginTop: '4px', display: 'block' }}>
            {metrics.paidOrdersCount} Paid Transactions
          </span>
        </div>

        {/* Card 2: Total Orders */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: '600' }}>Total Orders</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', fontFamily: 'var(--font-heading)' }}>
            {metrics.totalOrders}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
            Filtered Date Scope
          </span>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: '600' }}>Average Order Value</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#D97706', fontFamily: 'var(--font-heading)' }}>
            ₹{metrics.averageOrderValue}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
            Per Paid Checkout
          </span>
        </div>

        {/* Card 4: Order Completion Rate */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: '600' }}>Fulfillment Rate</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#166534', fontFamily: 'var(--font-heading)' }}>
            {metrics.fulfillmentRate}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
            {metrics.completedOrders} Orders Handed Over
          </span>
        </div>

        {/* Card 5: Cash to Collect */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: '600' }}>Pending Cash</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#DC2626', fontFamily: 'var(--font-heading)' }}>
            ₹{metrics.pendingCashRevenue}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
            Due at Canteen Counter
          </span>
        </div>
      </div>

      {/* View Switcher Tabs: Visual Analytics vs Transaction Audit Log */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '0.9rem',
            backgroundColor: activeTab === 'ANALYTICS' ? 'var(--color-forest)' : 'var(--color-white)',
            color: activeTab === 'ANALYTICS' ? 'var(--color-white)' : 'var(--color-dark)',
            border: `1.5px solid ${activeTab === 'ANALYTICS' ? 'var(--color-forest)' : 'var(--color-border)'}`,
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
        >
          <BarChart3 size={17} />
          <span>Visual Analytics Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('TABLE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '0.9rem',
            backgroundColor: activeTab === 'TABLE' ? 'var(--color-forest)' : 'var(--color-white)',
            color: activeTab === 'TABLE' ? 'var(--color-white)' : 'var(--color-dark)',
            border: `1.5px solid ${activeTab === 'TABLE' ? 'var(--color-forest)' : 'var(--color-border)'}`,
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
        >
          <FileSpreadsheet size={17} />
          <span>Transactions Audit Log ({filteredOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: VISUAL ANALYTICS DASHBOARD */}
      {activeTab === 'ANALYTICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {/* Row 1: 7-Day Revenue Trend Chart & Payment Methods Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {/* Chart 1: Daily Revenue Trend (7 Days) */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                    7-Day Daily Sales Trend
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    DynamoDB daily revenue & volume pattern
                  </span>
                </div>
                <span className="badge badge-completed" style={{ fontSize: '0.72rem' }}>
                  Live Data
                </span>
              </div>

              {/* Bar Chart Container */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '190px',
                paddingTop: '30px',
                borderBottom: '2px solid var(--color-border)',
                gap: '8px'
              }}>
                {trendDays.map((td, idx) => {
                  const barHeight = Math.max(12, Math.round((td.revenue / maxTrendRevenue) * 140));
                  const isTopDay = td.revenue === maxTrendRevenue && td.revenue > 0;

                  return (
                    <div 
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}
                      title={`${td.date}: ₹${td.revenue} (${td.orders} orders)`}
                    >
                      {/* Amount above bar */}
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isTopDay ? 'var(--color-orange)' : 'var(--color-forest)', marginBottom: '6px' }}>
                        {td.revenue > 0 ? `₹${td.revenue}` : '₹0'}
                      </span>

                      {/* Bar Pillar */}
                      <div style={{
                        width: '100%',
                        maxWidth: '38px',
                        height: `${barHeight}px`,
                        backgroundColor: isTopDay ? 'var(--color-orange)' : td.revenue > 0 ? 'var(--color-forest)' : '#E5E7EB',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 400ms ease, background-color 200ms',
                        boxShadow: isTopDay ? '0 0 10px rgba(244, 163, 64, 0.4)' : 'none'
                      }} />

                      {/* Date label */}
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {td.label.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                <span>• Bars scaled to peak revenue day</span>
                <span>Total 7-Day Revenue: <strong style={{ color: 'var(--color-forest)' }}>₹{trendDays.reduce((s, d) => s + d.revenue, 0)}</strong></span>
              </div>
            </div>

            {/* Chart 2: Payment Method Distribution */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                    Payment Channel Breakdown
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    UPI vs Cards vs Cash at counter
                  </span>
                </div>
                <PieChart size={18} color="var(--color-orange)" />
              </div>

              {/* Progress Bar Visualizer */}
              <div style={{
                height: '14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: '#E5E7EB',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: `${metrics.totalRevenue > 0 ? (metrics.payments.UPI.revenue / metrics.totalRevenue) * 100 : 33}%`,
                  backgroundColor: '#10B981',
                  transition: 'width 300ms ease'
                }} title={`UPI: ₹${metrics.payments.UPI.revenue}`} />
                <div style={{
                  width: `${metrics.totalRevenue > 0 ? (metrics.payments.CARD.revenue / metrics.totalRevenue) * 100 : 33}%`,
                  backgroundColor: '#3B82F6',
                  transition: 'width 300ms ease'
                }} title={`Cards: ₹${metrics.payments.CARD.revenue}`} />
                <div style={{
                  width: `${metrics.totalRevenue > 0 ? (metrics.payments.CASH.revenue / metrics.totalRevenue) * 100 : 34}%`,
                  backgroundColor: '#F59E0B',
                  transition: 'width 300ms ease'
                }} title={`Cash: ₹${metrics.payments.CASH.revenue}`} />
              </div>

              {/* Breakdown Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }} />
                    <strong style={{ fontSize: '0.9rem' }}>UPI Online Payment</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-forest)' }}>₹{metrics.payments.UPI.revenue}</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', display: 'block' }}>
                      {metrics.payments.UPI.count} orders ({metrics.totalOrders > 0 ? Math.round((metrics.payments.UPI.count / metrics.totalOrders) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3B82F6' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Credit & Debit Cards</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#2563EB' }}>₹{metrics.payments.CARD.revenue}</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', display: 'block' }}>
                      {metrics.payments.CARD.count} orders ({metrics.totalOrders > 0 ? Math.round((metrics.payments.CARD.count / metrics.totalOrders) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Cash at Canteen Counter</strong>
                      {metrics.payments.CASH.pending > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#DC2626', display: 'block' }}>
                          ₹{metrics.payments.CASH.pending} awaiting verification
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#D97706' }}>₹{metrics.payments.CASH.revenue}</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', display: 'block' }}>
                      {metrics.payments.CASH.count} orders ({metrics.totalOrders > 0 ? Math.round((metrics.payments.CASH.count / metrics.totalOrders) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Peak Dining Hours & Best Sellers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {/* Widget: Peak Dining Hours Heatmap */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                    Peak Canteen Rush Hours
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Meal slots and kitchen load analysis
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '0.75rem', fontWeight: '800' }}>
                  <Flame size={15} />
                  <span>KITCHEN RUSH</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { name: 'Breakfast (8 AM - 11 AM)', count: metrics.mealRush.breakfast, color: '#FBBF24' },
                  { name: 'Lunch Rush (11 AM - 2 PM)', count: metrics.mealRush.lunch, color: '#F97316', highlight: true },
                  { name: 'Afternoon Tea (2 PM - 5 PM)', count: metrics.mealRush.afternoon, color: '#3B82F6' },
                  { name: 'Evening Snacks (5 PM - 8 PM)', count: metrics.mealRush.evening, color: '#10B981' }
                ].map((slot, idx) => {
                  const maxSlot = Math.max(metrics.mealRush.breakfast, metrics.mealRush.lunch, metrics.mealRush.afternoon, metrics.mealRush.evening, 1);
                  const widthPct = Math.round((slot.count / maxSlot) * 100);

                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: slot.highlight ? '700' : '600' }}>{slot.name}</span>
                        <span>
                          <strong>{slot.count} orders</strong>
                          {slot.highlight && slot.count > 0 && (
                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#EA580C', fontWeight: '800' }}>
                              PEAK
                            </span>
                          )}
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.max(4, widthPct)}%`,
                          backgroundColor: slot.color,
                          borderRadius: '4px',
                          transition: 'width 300ms ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px', padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '0.78rem', color: '#92400E' }}>
                💡 <strong>Kitchen Planning Tip:</strong> Prepare high-demand ingredients before the 11 AM - 2 PM lunch rush to minimize token wait times.
              </div>
            </div>

            {/* Widget: Top Selling Items Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                    Top Selling Food Items
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Ranked by units sold & customer preference
                  </span>
                </div>
                <span className="badge badge-ready" style={{ fontSize: '0.75rem' }}>
                  Best Sellers
                </span>
              </div>

              {metrics.topItems.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', padding: '20px 0', textAlign: 'center' }}>
                  No food items ordered in the selected timeframe.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {metrics.topItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: idx < metrics.topItems.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? '#FEF3C7' : idx === 1 ? '#E0E7FF' : '#F3F4F6',
                          color: idx === 0 ? '#B45309' : idx === 1 ? '#3730A3' : '#4B5563',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-dark)' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', display: 'block' }}>{item.category}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-forest)' }}>{item.count} sold</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', display: 'block' }}>₹{item.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED TRANSACTIONS AUDIT LOG TABLE */}
      {activeTab === 'TABLE' && (
        <div>
          {loading ? (
            <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading report records...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <BarChart3 size={40} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)' }}>No Orders Match Your Filters</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Try selecting "All-Time" or resetting your status/payment filters.
              </p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-forest)' }}>
                  Showing {filteredOrders.length} Order Records
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  Click receipt button to download individual customer PDF
                </span>
              </div>

              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Token & Order ID</th>
                      <th>Student</th>
                      <th>Date & Time</th>
                      <th>Items Ordered</th>
                      <th>Total Amount</th>
                      <th>Payment Method</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.orderId}>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '1rem',
                            fontWeight: '800',
                            color: 'var(--color-forest)',
                            backgroundColor: 'var(--color-cream)',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--color-border)'
                          }}>
                            {o.tokenNumber}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                            {o.orderId}
                          </div>
                        </td>

                        <td>
                          <strong style={{ fontSize: '0.88rem', display: 'block' }}>{o.studentName || 'Student'}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                            {o.studentCollegeId ? `ID: ${o.studentCollegeId}` : o.studentEmail}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          <div style={{ fontSize: '0.72rem' }}>
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ fontSize: '0.82rem' }}>
                            {(o.items || []).map((it, i) => (
                              <span key={i} style={{ display: 'block' }}>
                                • {it.name} <strong style={{ color: 'var(--color-forest)' }}>×{it.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-forest)' }}>
                            ₹{o.totalAmount}
                          </strong>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                            {o.paymentMethod}
                          </span>
                        </td>

                        <td>
                          <span className={`badge ${o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                            {o.paymentStatus}
                          </span>
                        </td>

                        <td>
                          <OrderStatusBadge status={o.orderStatus} />
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => generateReceiptPdf(o)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Download PDF Receipt"
                          >
                            <Download size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
