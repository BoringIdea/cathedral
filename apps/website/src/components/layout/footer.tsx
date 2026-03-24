"use client";

import { useTranslation } from "@/lib/i18n-context";
import { Github, BookOpen } from "lucide-react";
import Link from "next/link";

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-[color:var(--bg-page)] px-4 py-3">
      <div className="flex justify-end">
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] font-mono text-[color:var(--fg-muted)]">
          <Link href="https://x.com/cathedral_dev" target="_blank" className="hover:text-[color:var(--fg-strong)] flex items-center gap-2">
            <XIcon />
            X
          </Link>
          <Link href="/litepaper" className="hover:text-[color:var(--fg-strong)] flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            {t("common.documents")}
          </Link>
          <Link href="https://github.com/BoringIdea/cathedral" target="_blank" className="hover:text-[color:var(--fg-strong)] flex items-center gap-2">
            <Github className="h-3.5 w-3.5" />
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
