"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rocket, TrendingUp, User, BookOpen, Settings, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from '@/lib/i18n-context';

/* 
  Navigation items are now generated dynamically inside the component 
  to support internationalization.
*/

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navigation = [
    { name: t('sidebar.markets'), href: "/", icon: BarChart2 },
    { name: t('sidebar.launch'), href: "/repository/create", icon: Rocket },
    { name: t('sidebar.litepaper'), href: "/litepaper", icon: BookOpen },
    { name: t('sidebar.profile'), href: "/user", icon: User },
  ];

  return (
    <div className={cn(
      "flex flex-col bg-background border-r border-border h-screen sticky top-0 transition-all duration-300 group pb-10",
      isCollapsed ? "w-16" : "w-56"
    )}>
      <div className={cn(
        "flex items-center h-16 border-b border-border transition-all duration-300",
        isCollapsed ? "px-4 justify-center" : "px-4"
      )}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="text-xl font-bold tracking-tighter truncate animate-in fade-in duration-500">CATHEDRAL</span>}
        </Link>
      </div>
      <nav className={cn(
        "flex-1 py-6 space-y-1 transition-all duration-300",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 py-2 text-sm font-medium rounded-sm transition-all duration-300 relative group/item",
                isCollapsed ? "px-0 justify-center" : "px-2",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("w-4 h-4 shrink-0 transition-transform", isActive ? "text-foreground" : "text-muted-foreground", isCollapsed && "group-hover/item:scale-110")} />
              {!isCollapsed && <span className="truncate animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-bold uppercase tracking-widest rounded-sm opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity border border-border z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle at Bottom */}
      <div className="p-4 border-t border-border flex justify-center">
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-sm transition-colors text-muted-foreground hover:text-foreground border border-border/50"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

    </div>
  );
}
