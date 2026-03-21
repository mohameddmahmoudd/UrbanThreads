'use client';

import type { TierProgress, TierConfig, TierBenefit } from '@/types/api.types';

type TierStatus = 'completed' | 'current' | 'in-progress' | 'locked';

export function VipTierWidget({ data }: { data: TierProgress | null }) {
  if (!data?.current) return null;

  const { current, next, progress, tiers } = data;

  const range = next ? next.minProgress - current.minProgress || 1 : 1;
  const pct = next
    ? Math.min(100, Math.round(((progress - current.minProgress) / range) * 100))
    : 100;
  const remaining = next ? Math.max(0, next.minProgress - progress) : 0;

  const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);

  function getTierStatus(tier: TierConfig): TierStatus {
    if (tier.order < current!.order) return 'completed';
    if (tier.order === current!.order) return 'current';
    if (next && tier.order === next.order) return 'in-progress';
    return 'locked';
  }

  return (
    <div className="space-y-4">
      {/* Current Tier + Progress */}
      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center gap-4">
          {current.icon && (
            <img src={current.icon} alt={current.name} className="h-12 w-12" />
          )}
          <div>
            <p className="text-xs font-medium text-gray-500">Your VIP Tier</p>
            <p className="text-xl font-bold">{current.name}</p>
          </div>
        </div>

        {next ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{current.name}</span>
              <span>{next.name}</span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {remaining.toLocaleString()} points to {next.name}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            You&apos;ve reached the highest tier!
          </p>
        )}
      </div>

      {/* Tier Ladder */}
      {sortedTiers.length > 0 && (
        <div className="rounded-lg border bg-white p-5">
          <p className="mb-3 text-xs font-medium text-gray-500">All Tiers</p>
          <div className="space-y-3">
            {sortedTiers.map((tier) => (
              <TierRow
                key={tier.order}
                tier={tier}
                status={getTierStatus(tier)}
                progressPct={
                  next && tier.order === next.order ? pct : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const statusBarColor: Record<TierStatus, string> = {
  completed: 'bg-green-500',
  current: 'bg-green-500',
  'in-progress': 'bg-orange-400',
  locked: 'bg-gray-300',
};

const statusBorder: Record<TierStatus, string> = {
  completed: 'border-green-200 bg-green-50',
  current: 'border-black bg-gray-50',
  'in-progress': 'border-orange-200 bg-orange-50',
  locked: '',
};

function TierRow({
  tier,
  status,
  progressPct,
}: {
  tier: TierConfig;
  status: TierStatus;
  progressPct?: number;
}) {
  const barWidth =
    status === 'completed' || status === 'current'
      ? 100
      : status === 'in-progress'
        ? progressPct ?? 0
        : 0;

  return (
    <div className={`rounded-lg border p-4 ${statusBorder[status]}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {tier.icon && (
          <img src={tier.icon} alt={tier.name} className="h-10 w-10" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${status === 'current' ? 'font-bold' : 'font-medium'}`}>
            {tier.name}
            {status === 'current' && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                Current
              </span>
            )}
            {status === 'locked' && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                Locked
              </span>
            )}
          </p>
          {tier.minProgress > 0 && (
            <p className="text-xs text-gray-400">
              {tier.minProgress.toLocaleString()} points required
            </p>
          )}
        </div>
        {(status === 'completed' || status === 'current') && (
          <span className="text-sm font-medium text-green-600">&#10003;</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${statusBarColor[status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Benefits */}
      {tier.benefits?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {tier.benefits
            .filter(hasMeaningfulContent)
            .filter((b, i, arr) => arr.findIndex((x) => benefitLabel(x) === benefitLabel(b)) === i)
            .map((benefit, i) => (
              <BenefitItem key={i} benefit={benefit} />
            ))}
        </ul>
      )}
    </div>
  );
}

function hasMeaningfulContent(benefit: TierBenefit): boolean {
  if (benefit.description) return true;
  if (benefit.rewardWalletFactor && benefit.rewardWalletFactor > 0) return true;
  if (benefit.walletReward && benefit.walletReward > 0) return true;
  if (benefit.rankReward && benefit.rankReward > 0) return true;
  if (benefit.couponReward) return true;
  return false;
}

function benefitLabel(benefit: TierBenefit): string {
  if (benefit.description) return benefit.description;
  if (benefit.rewardWalletFactor && benefit.rewardWalletFactor > 0)
    return `${benefit.rewardWalletFactor}x Points Multiplier`;
  if (benefit.walletReward && benefit.walletReward > 0)
    return `${benefit.walletReward} bonus points on entry`;
  if (benefit.rankReward && benefit.rankReward > 0)
    return `${benefit.rankReward} rank points on entry`;
  return benefit.type;
}

function BenefitItem({ benefit }: { benefit: TierBenefit }) {
  const label = benefitLabel(benefit);

  return (
    <li className="flex items-start gap-2 text-xs text-gray-600">
      <span className="mt-0.5 text-gray-400">&bull;</span>
      <span>
        {benefit.hyperLink ? (
          <a
            href={benefit.hyperLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black"
          >
            {label}
          </a>
        ) : (
          label
        )}
      </span>
    </li>
  );
}
