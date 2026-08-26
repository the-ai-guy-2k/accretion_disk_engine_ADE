export const SCHEMA_VERSION = "1";

export const FOUNDATION_TABLES = [
  "app_meta",
  "sources",
  "goals",
  "content_items",
  "campaigns",
  "approvals",
  "publications",
  "channels",
  "metrics",
  "audience_network_events",
  "leads",
  "opportunities",
  "recommendations"
] as const;

export type FoundationTable = (typeof FOUNDATION_TABLES)[number];
