'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CustomerBalance } from '@/types/api.types';

function formatCurrency(value: number | null | undefined, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function LoyaltyBalance() {
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CustomerBalance>('/users/me/balance')
      .then(setBalance)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="rounded-md border p-6 text-center text-gray-500">
        Balance data is currently unavailable.
      </div>
    );
  }

  const pointsName = balance.pointsName || 'Points';
  const currency = balance.currency || 'USD';

  return (
    <div className="space-y-5">
      {/* Total Points Summary */}
      <div className="rounded-lg border bg-gradient-to-br from-gray-400 via-gray-600 to-gray-900 p-6 text-white">
        <p className="text-sm font-medium text-gray-300">
          Total {pointsName}
        </p>
        <p className="mt-1 text-4xl font-bold">
          {balance.totalPointsBalance?.toLocaleString() ?? 0}
        </p>
        <p className="mt-1 text-sm text-gray-300">
          Worth {formatCurrency(balance.totalPointsValue, currency)}
        </p>
      </div>

      {/* Available + Pending */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium text-gray-500">
            Available {pointsName}
          </p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            {balance.avaliablePointsBalance?.toLocaleString() ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatCurrency(balance.avaliablePointsValue, currency)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium text-gray-500">
            Pending {pointsName}
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {balance.pendingPoints?.toLocaleString() ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatCurrency(balance.pendingPointsValue, currency)}
          </p>
        </div>
      </div>

      {/* Call-to-Action */}
      {balance.avaliablePointsBalance > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-sm font-semibold text-green-800">
            Redeem {balance.avaliablePointsBalance?.toLocaleString() ?? 0} {pointsName.toLowerCase()} to save{' '}
            {formatCurrency(balance.avaliablePointsValue, currency)}!
          </p>
        </div>
      )}

    </div>
  );
}
