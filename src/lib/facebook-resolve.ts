import {
  FACEBOOK_PLATFORM,
  configuredFacebookAdAccountId,
  configuredFacebookClientId,
  configuredFacebookPageId,
  facebookAdAccessToken,
  facebookPageAccessToken,
  graphApiVersion,
  normalizeAdAccountId
} from "./meta-config.ts";
import type { AcpPackage } from "./acp-validate.ts";

export const BLOCKED_VALIDATION =
  "REAL CONNECTION VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED";
export const BLOCKED_PUBLISH =
  "REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED";
export const FACEBOOK_ORGANIC_ADAPTER = "facebook_organic_page";
export const FACEBOOK_PAID_ADAPTER = "facebook_paid_marketing";
export const ORGANIC_PAGE_FEED_OPERATION = "page_feed_post";

export type ResolvedFacebookConnection = {
  platform: typeof FACEBOOK_PLATFORM;
  clientId: string;
  graphApiVersion: string;
  pageId: string | null;
  adAccountId: string | null;
  pageAuthorizationConfigured: boolean;
  advertisingAuthorizationConfigured: boolean;
  organicConfigured: boolean;
  paidConfigured: boolean;
};

function sameId(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function resolveFacebookConnection(
  clientId: string,
  platform: string
):
  | { ok: true; connection: ResolvedFacebookConnection }
  | {
      ok: false;
      code: "unsupported_platform" | "missing_connection_configuration" | "client_mismatch";
      message: string;
    } {
  if (platform.trim().toLowerCase() !== FACEBOOK_PLATFORM) {
    return {
      ok: false,
      code: "unsupported_platform",
      message: `Platform "${platform}" is not the Facebook connection. DGIX Facebook resolution only handles facebook.`
    };
  }
  const configuredClient = configuredFacebookClientId();
  const pageId = configuredFacebookPageId() || null;
  const adAccountId = normalizeAdAccountId(configuredFacebookAdAccountId()) || null;
  const pageAuth = Boolean(facebookPageAccessToken());
  if (!configuredClient && !pageId && !adAccountId && !pageAuth) {
    return {
      ok: false,
      code: "missing_connection_configuration",
      message:
        "No Facebook connection is configured. Set ADE_DGIX_FB_CLIENT_ID plus Page identity/authorization in .env.local. " +
        BLOCKED_VALIDATION
    };
  }
  if (!configuredClient) {
    return {
      ok: false,
      code: "missing_connection_configuration",
      message:
        "ADE_DGIX_FB_CLIENT_ID is not set. DGIX will not assume a client (including TAIG). " + BLOCKED_VALIDATION
    };
  }
  if (!sameId(clientId, configuredClient)) {
    return {
      ok: false,
      code: "client_mismatch",
      message: `No Facebook connection is configured for client "${clientId}". This process is bound to logical client "${configuredClient}".`
    };
  }
  return {
    ok: true,
    connection: {
      platform: FACEBOOK_PLATFORM,
      clientId: configuredClient,
      graphApiVersion: graphApiVersion(),
      pageId,
      adAccountId,
      pageAuthorizationConfigured: pageAuth,
      advertisingAuthorizationConfigured: Boolean(facebookAdAccessToken()) && Boolean(adAccountId),
      organicConfigured: Boolean(pageId && pageAuth),
      paidConfigured: Boolean(adAccountId && facebookAdAccessToken())
    }
  };
}

export function routeAuthorizedAcp(pkg: AcpPackage | { execution?: AcpPackage["execution"] }) {
  const execution = pkg.execution;
  if (!execution) {
    return {
      ready: false,
      executed: false,
      adapter: null,
      distributionType: null,
      reason: "Package is not execution-ready."
    };
  }
  const distributionType = execution.distributionType || "organic";
  const platform = execution.platform.toLowerCase();
  if (platform !== FACEBOOK_PLATFORM) {
    return {
      ready: false,
      executed: false,
      adapter: null,
      distributionType,
      reason: `No Facebook adapter for platform ${execution.platform}.`
    };
  }
  const adapter =
    distributionType === "paid" ? FACEBOOK_PAID_ADAPTER : FACEBOOK_ORGANIC_ADAPTER;
  if (distributionType === "paid") {
    return {
      ready: false,
      executed: false,
      adapter,
      distributionType,
      platform: FACEBOOK_PLATFORM,
      reason:
        "Paid Advertising Execution is NOT YET IMPLEMENTED. The organic Facebook adapter will not create Campaign/Ad Set/Creative/Ad objects."
    };
  }
  return {
    ready: true,
    executed: false,
    adapter,
    distributionType,
    platform: FACEBOOK_PLATFORM,
    operation: ORGANIC_PAGE_FEED_OPERATION,
    reason:
      "facebook + organic routes to the Facebook Organic Adapter (Page feed text post). Execution still requires Operator authorization, a valid organic connection, and an explicit execute action."
  };
}
