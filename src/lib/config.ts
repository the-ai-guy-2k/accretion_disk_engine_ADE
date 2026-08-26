import path from "node:path";

export const PRODUCT_NAME = "Accretion Disk Engine";
export const PRODUCT_SHORT = "ADE";
export const FOUNDATION_STAGE = "ACI-002 localhost MVP foundation";

export function sqlitePath(): string {
  const configured = process.env.ADE_SQLITE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), "data", "ade.sqlite");
}

export function sqliteDisplayPath(): string {
  return process.env.ADE_SQLITE_PATH?.trim() || "./data/ade.sqlite";
}

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/sources", label: "Sources" },
  { href: "/create", label: "Create" },
  { href: "/review", label: "Review" },
  { href: "/publishing", label: "Publishing" },
  { href: "/analytics", label: "Analytics" },
  { href: "/leads", label: "Leads" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/settings", label: "Settings" }
] as const;
