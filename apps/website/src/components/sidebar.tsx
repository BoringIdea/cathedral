"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, User, BookOpen, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-context";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navigation = [
    { name: t("sidebar.markets"), href: "/", icon: BarChart2 },
    { name: t("sidebar.launch"), href: "/repository/create", icon: Rocket },
    { name: t("sidebar.litepaper"), href: "/litepaper", icon: BookOpen },
    { name: t("sidebar.profile"), href: "/user", icon: User },
  ];

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-[color:var(--bg-page)] transition-all duration-300 pb-10",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("border-b border-border px-3 py-3", isCollapsed ? "px-2" : "px-4")}>
        <Link
          href="/"
          className={cn(
            "flex min-h-[42px] items-center text-[color:var(--fg-strong)]",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          {isCollapsed ? (
            <span className="text-[24px] leading-none tracking-[-0.04em]">C</span>
          ) : (
            <span className="text-[40px] leading-none tracking-[-0.04em]">Cathedral</span>
          )}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-1 px-3 py-5", isCollapsed ? "px-2 pt-4" : "pt-4")}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group/item flex items-center gap-3 border px-3 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors font-mono",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-strong)]"
                  : "border-transparent text-[color:var(--fg-muted)] hover:border-[color:var(--border-hairline)] hover:bg-[color:var(--bg-surface)] hover:text-[color:var(--fg-strong)]"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 flex justify-center">
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center border border-border text-[color:var(--fg-muted)] transition-colors hover:bg-[color:var(--bg-surface)] hover:text-[color:var(--fg-strong)]"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
