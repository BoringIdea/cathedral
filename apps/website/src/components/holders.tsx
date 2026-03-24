'use client';

import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Users, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n-context';

interface Holder {
  address: string;
  holding: number;
  percentage: number;
}

interface HoldersData {
  totalSupply: number;
  holders: Holder[];
}

interface HoldersProps {
  poolAddress: string;
  limit?: number;
  className?: string;
}

export default function Holders({ poolAddress, limit = 10, className }: HoldersProps) {
  const [holdersData, setHoldersData] = useState<HoldersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchHolders = async () => {
      if (!poolAddress) return;
      try {
        const response: ApiResponse<HoldersData> = await apiGet(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/pools/${poolAddress}/holders?limit=${limit}`
        );
        if (response.data) setHoldersData(response.data);
      } catch (error) {
        console.error('Failed to fetch holders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolders();
    const intervalId = setInterval(fetchHolders, 10000);
    return () => clearInterval(intervalId);
  }, [poolAddress, limit]);

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (isLoading && !holdersData) {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-4 w-28 bg-[color:var(--bg-muted)]" />
        <div className="h-48 border border-border bg-[color:var(--bg-surface)]" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 text-[11px] leading-tight text-[color:var(--fg-body)]', className)}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-[color:var(--fg-strong)]" />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--fg-strong)]">
            {t('holders.title')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
          <Activity className="h-3 w-3" />
          <span>{t('holders.live')}</span>
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-[color:var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_auto] border-b border-border bg-[color:var(--bg-muted)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
          <div>{t('holders.address_identity')}</div>
          <div className="text-right">{t('holders.ownership')}</div>
        </div>

        <div className="max-h-[320px] divide-y divide-border overflow-auto custom-scrollbar">
          {holdersData?.holders.map((holder, index) => (
            <div
              key={holder.address}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-[color:var(--bg-muted)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-[11px] text-[color:var(--fg-strong)]">{formatAddress(holder.address)}</span>
                {index === 0 && <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--fg-muted)]" />}
              </div>
              <div className="text-right font-mono text-[12px] text-[color:var(--fg-strong)]">
                {holder.percentage.toFixed(4)}%
              </div>
            </div>
          ))}

          {(!holdersData || holdersData.holders.length === 0) && (
            <div className="px-4 py-10 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">
              {t('holders.zero_nodes')}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
        <span>{t('holders.total_supply_node')}</span>
        <span className="text-[color:var(--fg-strong)]">
          {holdersData?.totalSupply.toLocaleString() || '--'} {t('holders.shares')}
        </span>
      </div>
    </div>
  );
}
