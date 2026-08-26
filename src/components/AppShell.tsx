"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FOUNDATION_STAGE,
  NAV_STANDARD_ADE,
  NAV_UTILITY,
  NAV_WORKSPACES,
  PRODUCT_NAME,
  PRODUCT_SHORT
} from "@/lib/config";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">{PRODUCT_SHORT}</p>
          <h1 className="brand-title">{PRODUCT_NAME}</h1>
          <p className="brand-sub">Operator hub</p>
        </div>
        <nav className="nav" aria-label="ADE hub">
          {NAV_WORKSPACES.map((item) => {
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
          <p className="nav-group">Standard ADE</p>
          {NAV_STANDARD_ADE.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          {NAV_UTILITY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          {pathname.startsWith("/dgix") ? (
            <>
              <strong>
                Campaign Package → Review → Approval → Distribution → Measurement →
                Intelligence → Results Package
              </strong>
              DGIX uses the ADE engine. AI assists. You decide. Unimplemented stages
              are labeled honestly.
            </>
          ) : (
            <>
              <strong>
                Goal → Campaign → Source → Draft → Review → Publishing → Results →
                Intelligence
              </strong>
              AI assists. You decide. ADE runs the approved workflow.
            </>
          )}
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
