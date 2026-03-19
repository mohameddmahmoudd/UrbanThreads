'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import type { Order, PaginatedResponse } from '@/types/api.types';

const STATUS_OPTIONS = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[] | null>(null);

  useEffect(() => {
    api
      .get<PaginatedResponse<any>>('/admin/orders?limit=50')
      .then((res) => setOrders(res.data));
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    setOrders((prev) =>
      prev?.map((o) => (o.id === orderId ? { ...o, status } : o)) || null,
    );
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>

      {!orders ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Items</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  {order.user?.email || '—'}
                </td>
                <td className="py-3">
                  ${parseFloat(order.totalAmount).toFixed(2)}
                </td>
                <td className="py-3">{order._count?.items || 0}</td>
                <td className="py-3">
                  <Badge variant={STATUS_VARIANT[order.status] || 'default'}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
