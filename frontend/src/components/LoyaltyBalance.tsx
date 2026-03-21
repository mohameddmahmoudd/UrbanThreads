'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import type { CustomerBalance } from '@/types/api.types';

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
  const hasExpiring =
    balance.nextExpiringPointsAmount > 0 && balance.nextExpiringPointsDate;
  const expiringDays = hasExpiring
    ? daysUntil(balance.nextExpiringPointsDate!)
    : 0;

  // Progress percentages relative to total
  const total = balance.totalPointsBalance || 1;
  const availablePct = Math.round((balance.availablePointsBalance / total) * 100);
  const pendingPct = Math.round((balance.pendingPoints / total) * 100);

  return (
    <div className="space-y-5">
      {/* Total Points Summary */}
      <div className="rounded-lg border bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-white">
        <p className="text-sm font-medium text-gray-300">
          Total {pointsName}
        </p>
        <p className="mt-1 text-4xl font-bold">
          {balance.totalPointsBalance.toLocaleString()}
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
            {balance.availablePointsBalance.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatCurrency(balance.availablePointsValue, currency)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium text-gray-500">
            Pending {pointsName}
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {balance.pendingPoints.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatCurrency(balance.pendingPointsValue, currency)}
          </p>
        </div>
      </div>

      {/* Call-to-Action */}
      {balance.availablePointsBalance > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-sm font-semibold text-green-800">
            Redeem {balance.availablePointsBalance.toLocaleString()} {pointsName.toLowerCase()} to save{' '}
            {formatCurrency(balance.availablePointsValue, currency)}!
          </p>
        </div>
      )}

      {/* Expiring Points Alert */}
      {hasExpiring && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <span className="mt-0.5 text-lg leading-none">&#9888;</span>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {balance.nextExpiringPointsAmount.toLocaleString()} {pointsName.toLowerCase()} expiring
              {expiringDays <= 1 ? ' today' : ` in ${expiringDays} days`}
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              {formatCurrency(balance.nextExpiringPointsValue, currency)} worth
              &middot; Expires {formatDate(balance.nextExpiringPointsDate!)}
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-xs font-medium text-gray-500">
          {pointsName} Breakdown
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="flex h-full">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${availablePct}%` }}
            />
            <div
              className="bg-yellow-400 transition-all"
              style={{ width: `${pendingPct}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            Available ({availablePct}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
            Pending ({pendingPct}%)
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Lifetime earned: {balance.totalEarnedPoints.toLocaleString()} {pointsName.toLowerCase()}
        </p>
      </div>
    </div>
  );
}
