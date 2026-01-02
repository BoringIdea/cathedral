"use client";

import Footer from "@/components/layout/footer";
import Sidebar from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isSidebarCollapsed ? "pl-0" : "pl-0"
        )}>
          <main className="flex-1 pb-10">
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Footer />
      </div>
    </div>
  );
}
