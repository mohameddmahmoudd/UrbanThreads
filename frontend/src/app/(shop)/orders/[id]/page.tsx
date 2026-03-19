import { api } from '@/lib/api';
import type { Order } from '@/types/api.types';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order: Order;
  try {
    order = await api.get<Order>(`/orders/${id}`);
  } catch {
    notFound();
  }

  const address = order.addressSnapshot as any;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/orders" className="mb-4 inline-block text-sm text-gray-500 hover:text-black">
        &larr; Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Badge>{order.status.replace('_', ' ')}</Badge>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Placed on {new Date(order.createdAt).toLocaleDateString()}
      </p>

      {/* Items */}
      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Items</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                {item.variantName && (
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                )}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">
                ${parseFloat(item.totalPrice).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section className="mt-6 rounded-md border p-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points Discount</span>
              <span>-${parseFloat(order.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Address */}
      {address && address.street && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">Delivery Address</h2>
          <p className="text-sm text-gray-700">
            {address.street}, {address.city}
            {address.state && `, ${address.state}`}, {address.country}
            {address.postalCode && ` ${address.postalCode}`}
          </p>
        </section>
      )}
    </div>
  );
}
