import React from 'react';
import { Clock, ChefHat, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';

export default function OrderStatusBadge({ status }) {
  switch (status) {
    case 'ORDER_CONFIRMED':
      return (
        <span className="badge badge-confirmed">
          <Clock size={12} /> Confirmed
        </span>
      );
    case 'PREPARING':
      return (
        <span className="badge badge-preparing">
          <ChefHat size={12} /> Preparing
        </span>
      );
    case 'READY_FOR_PICKUP':
      return (
        <span className="badge badge-ready pulse">
          <CheckCircle2 size={12} /> Ready for Pickup
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="badge badge-completed">
          <CheckCheck size={12} /> Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-cancelled">
          <XCircle size={12} /> Cancelled
        </span>
      );
    default:
      return (
        <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#374151' }}>
          {status}
        </span>
      );
  }
}
