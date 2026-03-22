import { api } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/types/api.types';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { cookies } from 'next/headers';

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export default async function OrdersPage() {
  const cookieHeader = (await cookies()).toString();

  let orders: PaginatedResponse<Order>;
  try {
    const res = await fetch(`${API_BASE}/orders?limit=20`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader, // forward browser cookies to backend
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }
    orders = (await res.json()) as PaginatedResponse<Order>;
  } catch {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Please log in to view orders.</p>
        <Link href="/login" className="mt-2 text-sm text-black underline">
          Login
        </Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      {orders.data.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="font-medium">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[order.status] || 'default'}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                  <p className="mt-1 font-semibold">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {order.items.map((item) => item.productName).join(', ')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
