import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import OwnerLayout from './layouts/OwnerLayout';

// Student Pages
import LandingPage from './pages/student/LandingPage';
import MenuPage from './pages/student/MenuPage';
import CartPage from './pages/student/CartPage';
import CheckoutPage from './pages/student/CheckoutPage';
import OrderConfirmationPage from './pages/student/OrderConfirmationPage';
import LiveTrackPage from './pages/student/LiveTrackPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import SuggestionsPage from './pages/student/SuggestionsPage';
import StudentLoginPage from './pages/student/StudentLoginPage';
import StudentRegisterPage from './pages/student/StudentRegisterPage';

// Welcome & Role Selection
import WelcomeAuthPage from './pages/auth/WelcomeAuthPage';

// Owner Pages
import OwnerLoginPage from './pages/owner/OwnerLoginPage';
import OwnerRegisterPage from './pages/owner/OwnerRegisterPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerLiveOrders from './pages/owner/OwnerLiveOrders';
import OwnerMenuManage from './pages/owner/OwnerMenuManage';
import OwnerPaymentHistory from './pages/owner/OwnerPaymentHistory';
import OwnerReports from './pages/owner/OwnerReports';
import OwnerStudents from './pages/owner/OwnerStudents';
import OwnerSuggestions from './pages/owner/OwnerSuggestions';
import OwnerSettings from './pages/owner/OwnerSettings';

import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Student & Public Facing Application */}
          <Route element={<StudentLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<WelcomeAuthPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders/confirmed/:id" element={<OrderConfirmationPage />} />
            <Route path="/orders/track/:id" element={<LiveTrackPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/login" element={<StudentLoginPage />} />
            <Route path="/register" element={<StudentRegisterPage />} />
            <Route path="/owner/register" element={<OwnerRegisterPage />} />
            <Route path="/owner/setup" element={<OwnerRegisterPage />} />
            <Route path="/owner/login" element={<OwnerLoginPage />} />
          </Route>

          {/* Owner Administrative Protected Dashboard */}
          <Route path="/owner" element={<OwnerLayout />}>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="live-orders" element={<OwnerLiveOrders />} />
            <Route path="menu" element={<OwnerMenuManage />} />
            <Route path="payments" element={<OwnerPaymentHistory />} />
            <Route path="reports" element={<OwnerReports />} />
            <Route path="students" element={<OwnerStudents />} />
            <Route path="suggestions" element={<OwnerSuggestions />} />
            <Route path="settings" element={<OwnerSettings />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
