"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Megaphone,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Unlock,
} from "lucide-react";
import { signOutAction } from "@/app/admin/auth-actions";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pages", label: "Pages", icon: FileText, exact: false },
  { href: "/admin/pages/new", label: "New Page", icon: PlusCircle, exact: true },
  { href: "/admin/ads", label: "Ads", icon: Megaphone, exact: true },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/admin/pages/new";

  const nav = (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            isActive(link.href, link.exact)
              ? "bg-primary/15 text-primary"
              : "text-muted hover:bg-surface-2 hover:text-foreground"
          }`}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        View site
      </a>
      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border-soft bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <Unlock className="h-5 w-5 text-primary" />
          UnlockHub Admin
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-muted hover:text-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[53px] z-40 flex flex-col gap-1 border-b border-border-soft bg-surface p-4 md:hidden animate-fade-in">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-1 border-r border-border-soft bg-surface p-4 md:flex">
        <Link
          href="/admin"
          className="mb-6 flex items-center gap-2 px-2 text-lg font-bold"
        >
          <Unlock className="h-5 w-5 text-primary" />
          UnlockHub
        </Link>
        {nav}
      </aside>
    </>
  );
}
