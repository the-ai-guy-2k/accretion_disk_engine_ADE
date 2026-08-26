export const SCHEMA_VERSION = "2";

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

export const CONTENT_STATUS = {
  draft: "draft",
  rejected: "rejected",
  approved: "approved"
} as const;

export const PUBLICATION_STATUS = {
  PENDING: "PENDING",
  READY: "READY",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED"
} as const;

export const MANUAL_FACEBOOK_ADAPTER_ID = "manual_facebook";
export const FACEBOOK_CHANNEL_TYPE = "facebook";

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];
export type PublicationStatus =
  (typeof PUBLICATION_STATUS)[keyof typeof PUBLICATION_STATUS];
export type FoundationTable = (typeof FOUNDATION_TABLES)[number];

export function canEnterPublishQueue(contentStatus: string | null | undefined): boolean {
  return contentStatus === CONTENT_STATUS.approved;
}

export function isTerminalPublished(publicationStatus: string | null | undefined): boolean {
  return publicationStatus === PUBLICATION_STATUS.PUBLISHED;
}

export function canHandToAdapter(publicationStatus: string | null | undefined): boolean {
  return publicationStatus === PUBLICATION_STATUS.PENDING;
}

export function canConfirmOrFail(publicationStatus: string | null | undefined): boolean {
  return publicationStatus === PUBLICATION_STATUS.READY;
}

export function canRetryFailed(publicationStatus: string | null | undefined): boolean {
  return publicationStatus === PUBLICATION_STATUS.FAILED;
}
