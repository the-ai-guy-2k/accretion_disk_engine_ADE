import {
  FACEBOOK_PLATFORM,
  META_GRAPH_HOST,
  facebookConnectionConfigPublic,
  graphApiVersion,
  metaAppId,
  metaAppSecret,
  metaTimeoutMs,
  normalizeAdAccountId
} from "./meta-config.ts";

export type MetaGraphErrorCode =
  | "missing_connection_configuration"
  | "invalid_expired_authorization"
  | "inaccessible_page"
  | "inaccessible_ad_account"
  | "insufficient_capability"
  | "meta_api_error"
  | "network_api_failure";

export type MetaGraphResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: MetaGraphErrorCode; message: string; metaCode?: number };

const SECRET_FRAGMENT = /access_token=[^&\s]+|input_token=[^&\s]+|appsecret=[^&\s]+|sk_[A-Za-z0-9]+/gi;

export function sanitizeMetaText(value: string): string {
  return value.replace(SECRET_FRAGMENT, "[redacted]").replace(/\|[A-Za-z0-9]+/g, "|[redacted]");
}

export function graphPathUrl(apiPath: string, version = graphApiVersion()): string {
  const cleaned = apiPath.replace(/^\/+/, "");
  return `${META_GRAPH_HOST}/${version}/${cleaned}`;
}

type GraphGetFn = (
  apiPath: string,
  query: Record<string, string>,
  accessToken: string
) => Promise<MetaGraphResult<Record<string, unknown>>>;

export async function graphGet(
  apiPath: string,
  query: Record<string, string>,
  accessToken: string
): Promise<MetaGraphResult<Record<string, unknown>>> {
  if (!accessToken) {
    return {
      ok: false,
      code: "missing_connection_configuration",
      message: "Facebook authorization is not configured on the server."
    };
  }
  const url = new URL(graphPathUrl(apiPath));
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), metaTimeoutMs());
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store"
    });
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (!res.ok || (payload && typeof payload === "object" && payload !== null && "error" in payload)) {
      return classifyGraphError(payload, res.status);
    }
    if (!payload || typeof payload !== "object") {
      return { ok: false, code: "meta_api_error", message: "Meta returned an unreadable response." };
    }
    return { ok: true, value: payload as Record<string, unknown> };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      code: "network_api_failure",
      message: aborted
        ? "Meta did not respond in time. ADE did not publish or create ads."
        : "ADE could not reach the Meta Graph API. ADE did not publish or create ads."
    };
  } finally {
    clearTimeout(timer);
  }
}

function classifyGraphError(payload: unknown, httpStatus: number): MetaGraphResult<Record<string, unknown>> {
  const error =
    payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: { message?: unknown; code?: unknown; type?: unknown } }).error
      : null;
  const rawMessage = typeof error?.message === "string" ? error.message : `Meta request failed (${httpStatus}).`;
  const message = sanitizeMetaText(rawMessage);
  const metaCode = typeof error?.code === "number" ? error.code : undefined;
  let code: MetaGraphErrorCode = "meta_api_error";
  const combined = `${message} ${error?.type || ""}`.toLowerCase();
  if (metaCode === 190 || /session has expired|invalid oauth|oauth exception|access token/i.test(combined)) {
    code = "invalid_expired_authorization";
  } else if (metaCode === 100 || metaCode === 803 || /does not exist|unsupported get request/i.test(combined)) {
    code = combined.includes("act_") || combined.includes("ad account") ? "inaccessible_ad_account" : "inaccessible_page";
  } else if (metaCode === 10 || metaCode === 200 || /permission|insufficient/i.test(combined)) {
    code = "insufficient_capability";
  } else if (httpStatus >= 500) {
    code = "network_api_failure";
  }
  return { ok: false, code, message, metaCode };
}

export async function debugAccessToken(
  inputToken: string,
  get: GraphGetFn = graphGet
): Promise<MetaGraphResult<{ isValid: boolean; scopes: string[]; type: string | null }>> {
  const appId = metaAppId();
  const appSecret = metaAppSecret();
  if (!appId || !appSecret) {
    return {
      ok: false,
      code: "missing_connection_configuration",
      message: "Token introspection requires META_APP_ID and META_APP_SECRET. Page validation can still use the Page token directly."
    };
  }
  const appToken = `${appId}|${appSecret}`;
  const result = await get("debug_token", { input_token: inputToken }, appToken);
  if (!result.ok) return result;
  const data = (result.value.data || result.value) as Record<string, unknown>;
  const scopesRaw = Array.isArray(data.scopes) ? data.scopes : [];
  return {
    ok: true,
    value: {
      isValid: data.is_valid === true,
      scopes: scopesRaw.filter((item): item is string => typeof item === "string"),
      type: typeof data.type === "string" ? data.type : null
    }
  };
}

export async function fetchPageIdentity(
  pageId: string,
  pageToken: string,
  get: GraphGetFn = graphGet
): Promise<MetaGraphResult<{ id: string; name: string | null }>> {
  const result = await get(pageId, { fields: "id,name" }, pageToken);
  if (!result.ok) {
    if (result.code === "inaccessible_ad_account") {
      return { ...result, code: "inaccessible_page" };
    }
    return result;
  }
  const id = typeof result.value.id === "string" ? result.value.id : "";
  if (!id) {
    return { ok: false, code: "inaccessible_page", message: "Meta did not return a Page id." };
  }
  return {
    ok: true,
    value: {
      id,
      name: typeof result.value.name === "string" ? result.value.name : null
    }
  };
}

export async function fetchAdAccountIdentity(
  adAccountId: string,
  token: string,
  get: GraphGetFn = graphGet
): Promise<MetaGraphResult<{ id: string; name: string | null; accountStatus: number | null }>> {
  const id = normalizeAdAccountId(adAccountId);
  const result = await get(`act_${id}`, { fields: "id,name,account_status" }, token);
  if (!result.ok) {
    if (result.code === "inaccessible_page") {
      return { ...result, code: "inaccessible_ad_account" };
    }
    return result;
  }
  const returned = typeof result.value.id === "string" ? normalizeAdAccountId(result.value.id) : "";
  if (!returned) {
    return { ok: false, code: "inaccessible_ad_account", message: "Meta did not return an Ad Account id." };
  }
  return {
    ok: true,
    value: {
      id: returned,
      name: typeof result.value.name === "string" ? result.value.name : null,
      accountStatus: typeof result.value.account_status === "number" ? result.value.account_status : null
    }
  };
}

export function facebookPublicConfigBanner() {
  const cfg = facebookConnectionConfigPublic();
  return {
    platform: FACEBOOK_PLATFORM,
    graphApiVersion: cfg.graphApiVersion,
    realPublishingImplemented: false,
    paidExecutionImplemented: false
  };
}

export type { GraphGetFn };
