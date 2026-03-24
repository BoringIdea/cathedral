'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { Monitor, Smartphone } from 'lucide-react';

export function MobileBlocker() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[color:var(--bg-page)] p-8 text-center">
      <div
        className="relative w-full max-w-sm border bg-[color:var(--bg-surface)] p-8"
        style={{ borderColor: "var(--border-hairline)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:18px_18px]" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-[color:var(--fg-muted)]">
            <Smartphone className="h-10 w-10" />
            <div className="h-px w-8 bg-current" />
            <Monitor className="h-10 w-10 text-[color:var(--fg-strong)]" />
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">Desktop only</div>
            <h2 className="cathedral-h2 text-[24px]">{t('mobile_block.title')}</h2>
            <p className="cathedral-copy text-[13px] leading-6">{t('mobile_block.description')}</p>
          </div>

          <div
            className="border bg-[color:var(--bg-muted)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            desktop interface
          </div>
        </div>
      </div>
    </div>
  );
}
