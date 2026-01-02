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

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="bg-secondary/10 p-8 rounded-sm border border-border max-w-sm w-full relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-muted-foreground/30">
            <Smartphone className="w-12 h-12" />
            <div className="h-px w-8 bg-current" />
            <Monitor className="w-12 h-12 text-primary animate-pulse" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
              {t('mobile_block.title')}
            </h2>
            <div className="h-0.5 w-12 bg-primary/50 mx-auto" />
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">
              {t('mobile_block.description')}
            </p>
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border border-border/50 px-3 py-1.5 rounded-full">
            Desktop Terminal v0.0.1
          </div>
        </div>
      </div>
    </div>
  );
}
