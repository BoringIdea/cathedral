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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading && !holdersData) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        <div className="h-4 bg-secondary/20 w-1/4 rounded-sm" />
        <div className="h-20 bg-secondary/10 rounded-sm" />
      </div>
    );
  }

  return (
    <div className={cn("font-mono text-[10px] leading-tight select-none", className)}>
      {/* Header Stat Area */}
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-1.5">
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-blue-500" />
          <h3 className="uppercase tracking-widest font-black text-foreground">{t('holders.title')}</h3>
        </div>
        <div className="flex items-center gap-1.5 opacity-50 font-bold">
          <Activity className="w-2.5 h-2.5" />
          <span>{t('holders.live')}</span>
        </div>
      </div>

      <div className="bg-secondary/5 border border-border/20 rounded-sm overflow-hidden">
        <div className="grid grid-cols-2 bg-secondary/10 border-b border-border/20 py-2 px-3">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{t('holders.address_identity')}</div>
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest text-right">{t('holders.ownership')}</div>
        </div>

        <div className="divide-y divide-border/10 max-h-[300px] overflow-auto custom-scrollbar">
          {holdersData?.holders.map((holder, index) => (
            <div key={holder.address} className="group flex items-center justify-between py-2 px-3 hover:bg-blue-500/[0.03] transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[8px] font-black text-muted-foreground opacity-30">0{index + 1}</span>
                <span className="text-foreground font-bold truncate tracking-tight">{formatAddress(holder.address)}</span>
                {index === 0 && <ShieldCheck className="w-2.5 h-2.5 text-blue-500/50 shrink-0" />}
              </div>
              <div className="text-right">
                <span className="text-[11px] font-black italic tracking-tighter text-blue-400 leading-none">
                  {holder.percentage.toFixed(4)}%
                </span>
              </div>
            </div>
          ))}

          {(!holdersData || holdersData.holders.length === 0) && (
            <div className="py-8 text-center text-muted-foreground/30 font-black uppercase tracking-widest">
              {t('holders.zero_nodes')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 opacity-20 text-[8px] font-black uppercase tracking-widest">
        <div className="w-1 h-1 bg-blue-500 rounded-full" />
        {t('holders.total_supply_node')}: {holdersData?.totalSupply.toLocaleString() || '--'} {t('holders.shares')}
      </div>
    </div>
  );
}
