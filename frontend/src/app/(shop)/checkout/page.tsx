'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/types/api.types';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

function CheckoutForm({
  clientSecret,
  orderTotal,
}: {
  clientSecret: string;
  orderTotal: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={processing} size="lg" className="w-full">
        Pay ${orderTotal.toFixed(2)}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { cart, holdPoints, releasePoints } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [clientSecret, setClientSecret] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [pointsAmount, setPointsAmount] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get<Address[]>('/users/me/addresses').then(setAddresses).catch(() => {});
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr.id);
    }
  }, [addresses, selectedAddress]);

  const [holdError, setHoldError] = useState('');

  const handleHoldPoints = async () => {
    const amount = parseFloat(pointsAmount);
    if (isNaN(amount) || amount <= 0) return;
    setHoldError('');
    holdPoints.mutate(amount, {
      onError: (err) => {
        setHoldError(
          err instanceof ApiError ? err.message : 'Failed to apply discount',
        );
      },
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      setError('Please select an address');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const res = await api.post<{
        clientSecret: string;
        totalAmount: number;
      }>('/orders', { addressId: selectedAddress });

      setClientSecret(res.clientSecret);
      setOrderTotal(res.totalAmount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return <p className="text-gray-500">Your cart is empty.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {/* Address Selection */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Delivery Address</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No addresses saved.{' '}
            <a href="/profile" className="font-medium text-black underline">
              Add one in your profile
            </a>{' '}
            before continuing.
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                  selectedAddress === addr.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                  className="accent-black"
                />
                <div className="text-sm">
                  {addr.label && (
                    <span className="font-medium">{addr.label}: </span>
                  )}
                  {addr.street}, {addr.city}
                  {addr.state && `, ${addr.state}`}, {addr.country}
                  {addr.postalCode && ` ${addr.postalCode}`}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Points Redemption */}
      <section className="mb-6 rounded-md border p-4">
        <h2 className="mb-3 text-lg font-semibold">Redeem Points</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(e.target.value)}
            placeholder="Discount amount ($)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <Button
            onClick={handleHoldPoints}
            variant="secondary"
            loading={holdPoints.isPending}
            size="sm"
          >
            Apply Discount
          </Button>
          {cart.holdReference && (
            <Button
              onClick={() => releasePoints.mutate()}
              variant="ghost"
              loading={releasePoints.isPending}
              size="sm"
            >
              Remove Discount
            </Button>
          )}
        </div>
        {holdError && (
          <p className="mt-2 text-sm text-red-600">{holdError}</p>
        )}
        {cart.holdAmount && cart.holdAmount > 0 && (
          <p className="mt-2 text-sm text-green-600">
            ${cart.holdAmount.toFixed(2)} discount applied
          </p>
        )}
      </section>

      {/* Order Summary */}
      <section className="mb-6 rounded-md border p-4">
        <h2 className="mb-3 text-lg font-semibold">Summary</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({cart.items.length} items)</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          {cart.holdAmount && cart.holdAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points Discount</span>
              <span>-${cart.holdAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {/* Payment */}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} orderTotal={orderTotal} />
        </Elements>
      ) : (
        <Button
          onClick={handleCreateOrder}
          loading={creating}
          size="lg"
          className="w-full"
          disabled={!selectedAddress}
        >
          Continue to Payment
        </Button>
      )}
    </div>
  );
}
