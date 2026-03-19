'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();

  if (isLoading) {
    return <p className="text-gray-500">Loading cart...</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border bg-white p-4"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                {item.variant && (
                  <p className="text-sm text-gray-500">{item.variant.name}</p>
                )}
                <p className="text-sm font-semibold">
                  ${parseFloat(item.unitPrice).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center rounded-md border">
                <button
                  onClick={() =>
                    item.quantity > 1
                      ? updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                      : removeItem.mutate(item.id)
                  }
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                  }
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <p className="w-20 text-right font-semibold">
                ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
              </p>

              <button
                onClick={() => removeItem.mutate(item.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.holdAmount && cart.holdAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Points Discount</span>
                <span>-${cart.holdAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout">
            <Button className="mt-6 w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
