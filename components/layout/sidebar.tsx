"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  PlusCircle,
  LogOut,
  Building2,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { canCreateCase } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/workflow/labels";
import type { Role } from "@/lib/workflow/transitions";

interface SidebarProps {
  userEmail?: string;
  userRole?: Role;
}

export function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Todos los Casos",
      href: "/casos",
      icon: FolderKanban,
    },
    {
      label: "Clientes",
      href: "/clientes",
      icon: Users,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xs">
      {/* Header / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Building2 className="size-5" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-slate-900 leading-none">
              TUME
            </span>
            <span className="block text-[11px] font-medium text-slate-400">
              Proceso Cotización
            </span>
          </div>
        </Link>
      </div>

      {/* CTA Button — solo roles que pueden registrar casos (ver lib/permissions.ts) */}
      {canCreateCase(userRole) && (
        <div className="p-4">
          <Link
            href="/casos/nuevo"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99]"
          >
            <PlusCircle className="size-4" />
            <span>Nuevo Caso</span>
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navegación
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`size-4 ${
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Role Info + Logout */}
      <div className="border-t border-slate-100 p-4">
        {userEmail && (
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {userEmail}
                </p>
                {userRole && (
                  <span className="inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    {ROLE_LABEL[userRole] ?? userRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="size-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
