'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const setItemCount = useCartStore((s) => s.setItemCount);

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (!paymentIntent || redirectStatus !== 'succeeded') {
      setStatus('error');
      setError('Payment was not completed.');
      return;
    }

    api
      .post('/orders/confirm', { paymentIntentId: paymentIntent })
      .then(() => {
        setStatus('success');
        setItemCount(0);
      })
      .catch(() => {
        setStatus('error');
        setError('Could not confirm your order. Please check your orders page.');
      });
  }, [searchParams, setItemCount]);

  if (status === 'loading') {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Confirming your order...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link
          href="/orders"
          className="mt-6 inline-block rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
        >
          View Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold text-green-700">Order Placed!</h1>
      <p className="mt-2 text-gray-600">
        Your payment was successful and your order is being processed.
      </p>
      <Link
        href="/orders"
        className="mt-6 inline-block rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
      >
        View Orders
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
