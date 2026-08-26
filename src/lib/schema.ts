export const SCHEMA_VERSION = "4";

export const FOUNDATION_TABLES = [
  "app_meta",
  "sources",
  "goals",
  "content_items",
  "campaigns",
  "campaign_sources",
  "campaign_plan_items",
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

export const GOAL_STATUS = {
  active: "active",
  paused: "paused",
  achieved: "achieved",
  archived: "archived"
} as const;

export const CAMPAIGN_STATUS = {
  planning: "planning",
  active: "active",
  paused: "paused",
  completed: "completed"
} as const;

export const MANUAL_FACEBOOK_ADAPTER_ID = "manual_facebook";
export const FACEBOOK_CHANNEL_TYPE = "facebook";

export const METRIC_KEYS = [
  "views_reach",
  "reactions",
  "comments",
  "shares",
  "clicks",
  "audience_network_gained",
  "meaningful_conversations",
  "leads_generated"
] as const;

export const METRIC_LABELS: Record<(typeof METRIC_KEYS)[number], string> = {
  views_reach: "Views / reach",
  reactions: "Reactions",
  comments: "Comments",
  shares: "Shares",
  clicks: "Clicks",
  audience_network_gained: "Audience Network gained",
  meaningful_conversations: "Meaningful conversations",
  leads_generated: "Leads generated"
};

export const CAPTURE_METHOD = {
  manual: "manual",
  platform: "platform"
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];
export type PublicationStatus =
  (typeof PUBLICATION_STATUS)[keyof typeof PUBLICATION_STATUS];
export type GoalStatus = (typeof GOAL_STATUS)[keyof typeof GOAL_STATUS];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];
export type MetricKey = (typeof METRIC_KEYS)[number];
export type CaptureMethod = (typeof CAPTURE_METHOD)[keyof typeof CAPTURE_METHOD];
export type FoundationTable = (typeof FOUNDATION_TABLES)[number];

export function isMetricKey(value: string): value is MetricKey {
  return (METRIC_KEYS as readonly string[]).includes(value);
}

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
