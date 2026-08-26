import path from "node:path";

export const PRODUCT_NAME = "Accretion Disk Engine";
export const PRODUCT_SHORT = "ADE";
export const FOUNDATION_STAGE = "MVP baseline";

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

export const NAV_WORKSPACES = [
  { href: "/", label: "Hub" },
  { href: "/dgix", label: "DGIX" }
] as const;

export const NAV_STANDARD_ADE = [
  { href: "/goals", label: "Goals" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/sources", label: "Sources" },
  { href: "/create", label: "Create" },
  { href: "/review", label: "Review" },
  { href: "/publishing", label: "Publishing" },
  { href: "/analytics", label: "Analytics" },
  { href: "/intelligence", label: "Intelligence" }
] as const;

export const NAV_UTILITY = [{ href: "/settings", label: "Settings" }] as const;

export const NAV_ITEMS = [...NAV_WORKSPACES, ...NAV_STANDARD_ADE, ...NAV_UTILITY];
