"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Gavel,
  Phone,
  Users,
  Settings,
  Languages,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

const NAV = [
  { href: "/admin", label: "Töölaud", icon: LayoutDashboard, exact: true },
  { href: "/admin/oksjonid", label: "Oksjonid", icon: Gavel },
  { href: "/admin/telefonoksjon", label: "Telefonoksjon", icon: Phone },
  { href: "/admin/kasutajad", label: "Kasutajad", icon: Users },
  { href: "/admin/toolk", label: "Tõlked", icon: Languages },
  { href: "/admin/seaded", label: "Seaded", icon: Settings },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border p-3">
      <p className="truncate px-3 pb-2 text-xs text-muted">{userName}</p>
      <Link
        href="/"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        Vaata lehte
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Logi välja
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-header px-4 lg:hidden">
        <Logo className="!text-lg" />
        <button onClick={() => setOpen(!open)} className="cursor-pointer" aria-label="Menüü">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-header pt-14 transition-transform lg:static lg:translate-x-0 lg:pt-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="hidden items-center border-b border-border p-4 lg:flex">
          <Logo className="!text-xl" />
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
