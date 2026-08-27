import { getDb } from "@/lib/db";
import {
  FACEBOOK_PLATFORM,
  facebookAdAccessToken,
  facebookConnectionConfigPublic,
  facebookPageAccessToken
} from "@/lib/meta-config";
import {
  debugAccessToken,
  fetchAdAccountIdentity,
  fetchPageIdentity,
  type GraphGetFn,
  type MetaGraphErrorCode,
  graphGet
} from "@/lib/meta-graph";
import {
  BLOCKED_VALIDATION,
  resolveFacebookConnection,
  routeAuthorizedAcp
} from "@/lib/facebook-resolve";

export { BLOCKED_VALIDATION, resolveFacebookConnection, routeAuthorizedAcp };
export type { ResolvedFacebookConnection } from "@/lib/facebook-resolve";

export const CONNECTION_STATUS = {
  connected: "connected",
  not_connected: "not_connected",
  invalid: "invalid"
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

export type FacebookValidationPublic = {
  facebook: "CONNECTED" | "NOT CONNECTED" | "INVALID";
  organic: "AVAILABLE" | "NOT AVAILABLE";
  paid: "AVAILABLE" | "NOT AVAILABLE";
  graphApiVersion: string;
  clientId: string | null;
  page: { id: string | null; name: string | null };
  adAccount: { id: string | null; name: string | null };
  realPublishingImplemented: boolean;
  paidExecutionImplemented: false;
  realValidation: "not_attempted" | "blocked" | "succeeded" | "failed";
  blockedReason: string | null;
  failures: { code: MetaGraphErrorCode | "client_mismatch" | "unsupported_platform"; message: string }[];
  lastValidatedAt: string | null;
  tokenExposed: false;
};

function emptyValidation(overrides: Partial<FacebookValidationPublic> = {}): FacebookValidationPublic {
  const cfg = facebookConnectionConfigPublic();
  return {
    facebook: "NOT CONNECTED",
    organic: "NOT AVAILABLE",
    paid: "NOT AVAILABLE",
    graphApiVersion: cfg.graphApiVersion,
    clientId: cfg.clientId,
    page: { id: cfg.pageId, name: null },
    adAccount: { id: cfg.adAccountId, name: null },
    realPublishingImplemented: cfg.realPublishingImplemented,
    paidExecutionImplemented: false,
    realValidation: "not_attempted",
    blockedReason: null,
    failures: [],
    lastValidatedAt: null,
    tokenExposed: false,
    ...overrides
  };
}

function readSnapshot(clientId: string | null): FacebookValidationPublic | null {
  if (!clientId) return null;
  const row = getDb()
    .prepare(
      `SELECT * FROM dgix_platform_connections WHERE client_id = ? AND platform = ? LIMIT 1`
    )
    .get(clientId, FACEBOOK_PLATFORM) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    facebook: row.connection_status === "connected" ? "CONNECTED" : row.connection_status === "invalid" ? "INVALID" : "NOT CONNECTED",
    organic: row.organic_available ? "AVAILABLE" : "NOT AVAILABLE",
    paid: row.paid_available ? "AVAILABLE" : "NOT AVAILABLE",
    graphApiVersion: String(row.graph_api_version || graphApiVersion()),
    clientId: String(row.client_id),
    page: {
      id: row.page_id ? String(row.page_id) : null,
      name: row.page_name ? String(row.page_name) : null
    },
    adAccount: {
      id: row.ad_account_id ? String(row.ad_account_id) : null,
      name: row.ad_account_name ? String(row.ad_account_name) : null
    },
    realPublishingImplemented: facebookConnectionConfigPublic().realPublishingImplemented,
    paidExecutionImplemented: false,
    realValidation: row.connection_status === "connected" ? "succeeded" : row.last_error ? "failed" : "not_attempted",
    blockedReason: row.blocked_reason ? String(row.blocked_reason) : null,
    failures: row.last_error
      ? [{ code: "meta_api_error", message: String(row.last_error) }]
      : [],
    lastValidatedAt: row.last_validated_at ? String(row.last_validated_at) : null,
    tokenExposed: false
  };
}

function persistSnapshot(view: FacebookValidationPublic): void {
  if (!view.clientId) return;
  const stamp = nowIso();
  const status =
    view.facebook === "CONNECTED"
      ? CONNECTION_STATUS.connected
      : view.facebook === "INVALID"
        ? CONNECTION_STATUS.invalid
        : CONNECTION_STATUS.not_connected;
  getDb()
    .prepare(
      `INSERT INTO dgix_platform_connections (
        client_id, platform, graph_api_version, page_id, page_name, ad_account_id, ad_account_name,
        organic_available, paid_available, connection_status, last_validated_at, last_error, blocked_reason,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_id, platform) DO UPDATE SET
        graph_api_version = excluded.graph_api_version,
        page_id = excluded.page_id,
        page_name = excluded.page_name,
        ad_account_id = excluded.ad_account_id,
        ad_account_name = excluded.ad_account_name,
        organic_available = excluded.organic_available,
        paid_available = excluded.paid_available,
        connection_status = excluded.connection_status,
        last_validated_at = excluded.last_validated_at,
        last_error = excluded.last_error,
        blocked_reason = excluded.blocked_reason,
        updated_at = excluded.updated_at`
    )
    .run(
      view.clientId,
      FACEBOOK_PLATFORM,
      view.graphApiVersion,
      view.page.id,
      view.page.name,
      view.adAccount.id,
      view.adAccount.name,
      view.organic === "AVAILABLE" ? 1 : 0,
      view.paid === "AVAILABLE" ? 1 : 0,
      status,
      view.lastValidatedAt || stamp,
      view.failures[0]?.message || null,
      view.blockedReason,
      stamp,
      stamp
    );
}

export function facebookConnectionPublicStatus(): FacebookValidationPublic {
  const cfg = facebookConnectionConfigPublic();
  const snapshot = readSnapshot(cfg.clientId);
  if (snapshot) {
    return {
      ...snapshot,
      graphApiVersion: cfg.graphApiVersion,
      clientId: cfg.clientId,
      realPublishingImplemented: cfg.realPublishingImplemented,
      paidExecutionImplemented: false,
      tokenExposed: false
    };
  }
  const blocked =
    !cfg.clientId || (!cfg.pageAuthorizationConfigured && !cfg.advertisingAuthorizationConfigured);
  return emptyValidation({
    facebook: "NOT CONNECTED",
    realValidation: blocked ? "blocked" : "not_attempted",
    blockedReason: blocked ? BLOCKED_VALIDATION : null
  });
}

export async function validateFacebookConnection(options?: {
  clientId?: string;
  graphGet?: GraphGetFn;
}): Promise<FacebookValidationPublic> {
  const cfg = facebookConnectionConfigPublic();
  const clientId = (options?.clientId || cfg.clientId || "").trim();
  const get = options?.graphGet || graphGet;
  const stamp = nowIso();

  if (!clientId) {
    const view = emptyValidation({
      facebook: "NOT CONNECTED",
      realValidation: "blocked",
      blockedReason: BLOCKED_VALIDATION,
      failures: [
        {
          code: "missing_connection_configuration",
          message: "ADE_DGIX_FB_CLIENT_ID is not set. TAIG is not assumed. " + BLOCKED_VALIDATION
        }
      ],
      lastValidatedAt: stamp
    });
    return view;
  }

  const resolved = resolveFacebookConnection(clientId, FACEBOOK_PLATFORM);
  if (!resolved.ok) {
    const blocked = resolved.code === "missing_connection_configuration";
    const view = emptyValidation({
      facebook: "NOT CONNECTED",
      clientId: cfg.clientId,
      realValidation: blocked ? "blocked" : "failed",
      blockedReason: blocked ? BLOCKED_VALIDATION : null,
      failures: [{ code: resolved.code, message: resolved.message }],
      lastValidatedAt: stamp
    });
    persistSnapshot(view);
    return view;
  }

  const connection = resolved.connection;
  const failures: FacebookValidationPublic["failures"] = [];
  let pageName: string | null = null;
  let pageId = connection.pageId;
  let adName: string | null = null;
  let adId = connection.adAccountId;
  let organicAvailable = false;
  let paidAvailable = false;

  const pageToken = facebookPageAccessToken();
  if (!connection.organicConfigured) {
    failures.push({
      code: "missing_connection_configuration",
      message:
        "Organic Page operations need FACEBOOK_PAGE_ID (or ADE_DGIX_FB_PAGE_ID) and a Page access token. " +
        BLOCKED_VALIDATION
    });
  } else {
    const page = await fetchPageIdentity(connection.pageId as string, pageToken, get);
    if (page.ok) {
      organicAvailable = true;
      pageId = page.value.id;
      pageName = page.value.name;
      if (metaAppHasSecret()) {
        const introspect = await debugAccessToken(pageToken, get);
        if (introspect.ok && !introspect.value.isValid) {
          organicAvailable = false;
          failures.push({
            code: "invalid_expired_authorization",
            message: "The configured Page authorization is not valid."
          });
        }
      }
    } else {
      failures.push({ code: page.code, message: page.message });
    }
  }

  if (!connection.paidConfigured) {
    failures.push({
      code: "missing_connection_configuration",
      message:
        "Paid advertising operations need META_AD_ACCOUNT_ID and advertising authorization. Organic Page connection is independent."
    });
  } else {
    const ad = await fetchAdAccountIdentity(
      connection.adAccountId as string,
      facebookAdAccessToken(),
      get
    );
    if (ad.ok) {
      paidAvailable = true;
      adId = ad.value.id;
      adName = ad.value.name;
    } else {
      failures.push({ code: ad.code, message: ad.message });
    }
  }

  const attemptedLive = connection.organicConfigured || connection.paidConfigured;
  const facebookStatus: FacebookValidationPublic["facebook"] = organicAvailable || paidAvailable
    ? "CONNECTED"
    : attemptedLive
      ? "INVALID"
      : "NOT CONNECTED";
  const blocked = !attemptedLive;

  const view: FacebookValidationPublic = {
    facebook: facebookStatus,
    organic: organicAvailable ? "AVAILABLE" : "NOT AVAILABLE",
    paid: paidAvailable ? "AVAILABLE" : "NOT AVAILABLE",
    graphApiVersion: connection.graphApiVersion,
    clientId: connection.clientId,
    page: { id: pageId, name: pageName },
    adAccount: { id: adId, name: adName },
    realPublishingImplemented: facebookConnectionConfigPublic().realPublishingImplemented,
    paidExecutionImplemented: false,
    realValidation: blocked ? "blocked" : organicAvailable || paidAvailable ? "succeeded" : "failed",
    blockedReason: blocked ? BLOCKED_VALIDATION : null,
    failures,
    lastValidatedAt: stamp,
    tokenExposed: false
  };
  persistSnapshot(view);
  return view;
}

function metaAppHasSecret(): boolean {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}
