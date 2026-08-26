"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOUNDATION_STAGE, NAV_ITEMS, PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">{PRODUCT_SHORT}</p>
          <h1 className="brand-title">{PRODUCT_NAME}</h1>
          <p className="brand-sub">Localhost operator hub</p>
        </div>
        <nav className="nav" aria-label="ADE hub">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="philosophy">
          <strong>Goals → Decisions → Results</strong>
          Operator philosophy for ADE. ACI-004: Source → Draft → Review → Queue.
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>{PRODUCT_NAME}</span>
          <span className="badge">{FOUNDATION_STAGE}</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
