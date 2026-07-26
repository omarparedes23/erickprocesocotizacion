"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import type { Role } from "@/lib/workflow/transitions";

interface AppLayoutProps {
  userEmail?: string;
  userRole?: Role;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({
  userEmail,
  userRole,
  title,
  description,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Fixed Left Sidebar */}
      <Sidebar userEmail={userEmail} userRole={userRole} />

      {/* Main Content Area (offset by sidebar width w-64 = 16rem = 256px) */}
      <div className="pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs font-medium text-slate-500">{description}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Page Body */}
        <main className="p-8 max-w-6xl mx-auto space-y-6">{children}</main>
      </div>
    </div>
  );
}
