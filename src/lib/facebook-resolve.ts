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
    distributionType === "paid" ? "facebook_paid_marketing" : "facebook_organic_page";
  return {
    ready: false,
    executed: false,
    adapter,
    distributionType,
    platform: FACEBOOK_PLATFORM,
    reason:
      distributionType === "paid"
        ? "Paid Advertising Execution is NOT YET IMPLEMENTED. Routing contract only. No Campaign/Ad Set/Creative/Ad was created."
        : "Real Facebook Publishing is NOT YET IMPLEMENTED. Routing contract only. No Page post was published."
  };
}
