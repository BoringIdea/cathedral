"use client";
import { useTranslation } from '@/lib/i18n-context';

import { Github, BookOpen, Wifi, Activity, Terminal } from "lucide-react";
import Link from "next/link";

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3.5 h-3.5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="h-10 border-t border-border bg-background flex items-center justify-between px-4 text-[10px] text-muted-foreground uppercase tracking-wider select-none shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-20" />
          </div>
          <span className="text-emerald-500/80 font-medium font-mono tracking-tighter">{t('common.system_ready')}</span>
        </div>

        <div className="hidden lg:flex items-center gap-4 border-l border-border pl-6 h-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 opacity-50" />
            <span>{t('common.network')}: Solana Devnet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 opacity-50" />
            <span>24ms</span>
          </div>
        </div>
      </div>

      <div className="flex-1 hidden md:flex items-center justify-center px-10 overflow-hidden">
        <div className="flex items-center gap-2 text-white/20 font-mono whitespace-nowrap">
          <Terminal className="w-3 h-3 shrink-0" />
          <span className="animate-pulse shrink-0">_</span>
          <span className="truncate">{t('common.scanning')}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <Link
          href="https://x.com/cathedral_dev"
          target="_blank"
          className="hover:text-foreground transition-all duration-200 flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-sm group-hover:bg-secondary transition-colors">
            <XIcon />
          </div>
          <span className="hidden sm:inline">X</span>
        </Link>
        <Link
          href="/litepaper"
          className="hover:text-foreground transition-all duration-200 flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-sm group-hover:bg-secondary transition-colors">
            <BookOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
          <span className="hidden sm:inline">{t('common.documents')}</span>
        </Link>
        <Link
          href="https://github.com/BoringIdea/cathedral"
          target="_blank"
          className="hover:text-foreground transition-all duration-200 flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-sm group-hover:bg-secondary transition-colors">
            <Github className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
          <span className="hidden sm:inline">Github</span>
        </Link>
      </div>
    </footer>
  );
}
