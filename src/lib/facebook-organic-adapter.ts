/** Bounded Facebook organic Page adapter. Translates ACP execution fields; does not rewrite copy. */

import type { AcpExecution, AcpPackage } from "./acp-validate.ts";
import {
  FACEBOOK_ORGANIC_ADAPTER,
  ORGANIC_PAGE_FEED_OPERATION
} from "./facebook-resolve.ts";
import { FACEBOOK_PLATFORM, graphApiVersion } from "./meta-config.ts";
import { graphPost, type GraphPostFn, type MetaGraphResult } from "./meta-graph.ts";

export const PAID_ORGANIC_REFUSAL =
  "Paid Advertising Execution is NOT YET IMPLEMENTED. The organic Facebook adapter will not create Campaign, Ad Set, Creative, or Ad objects.";

export const IMAGE_POST_UNSUPPORTED =
  "This organic adapter publishes a Facebook Page feed text post only. Image uploads are not implemented. DGIX did not invent a photo file or call a photo endpoint.";

export type PageFeedMapping =
  | {
      ok: true;
      adapterId: typeof FACEBOOK_ORGANIC_ADAPTER;
      operation: typeof ORGANIC_PAGE_FEED_OPERATION;
      graphApiVersion: string;
      apiPath: string;
      fields: Record<string, string>;
      messageUnmodified: true;
    }
  | { ok: false; code: string; message: string };

function httpLink(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : undefined;
}

function scheduledUnix(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return undefined;
  return String(Math.floor(ms / 1000));
}

export function mapAcpToPageFeed(
  execution: AcpExecution,
  pageId: string
): PageFeedMapping {
  const distributionType = execution.distributionType || "organic";
  if (distributionType === "paid") {
    return { ok: false, code: "paid_not_implemented", message: PAID_ORGANIC_REFUSAL };
  }
  if (execution.platform.trim().toLowerCase() !== FACEBOOK_PLATFORM) {
    return {
      ok: false,
      code: "unsupported_platform",
      message: `The organic Facebook adapter only handles platform=facebook, not ${execution.platform}.`
    };
  }
  if (execution.postType === "image") {
    return { ok: false, code: "unsupported_post_type", message: IMAGE_POST_UNSUPPORTED };
  }
  if (execution.postType !== "text") {
    return {
      ok: false,
      code: "unsupported_post_type",
      message: `Unsupported organic post type "${execution.postType}". This adapter publishes a Page feed text post.`
    };
  }
  if (!execution.message.trim()) {
    return {
      ok: false,
      code: "malformed_execution_data",
      message: "execution.message is required. DGIX will not invent Facebook copy."
    };
  }
  if (!pageId.trim()) {
    return {
      ok: false,
      code: "missing_page",
      message: "A Facebook Page id is required for organic publishing."
    };
  }

  const fields: Record<string, string> = {
    message: execution.message
  };
  const link = httpLink(execution.link);
  if (link) fields.link = link;
  if (execution.publishMode === "scheduled") {
    const unix = scheduledUnix(execution.scheduledAt);
    if (!unix) {
      return {
        ok: false,
        code: "malformed_execution_data",
        message: "A scheduled organic post requires a valid execution.scheduledAt timestamp."
      };
    }
    fields.published = "false";
    fields.scheduled_publish_time = unix;
  }

  return {
    ok: true,
    adapterId: FACEBOOK_ORGANIC_ADAPTER,
    operation: ORGANIC_PAGE_FEED_OPERATION,
    graphApiVersion: graphApiVersion(),
    apiPath: `${pageId.trim()}/feed`,
    fields,
    messageUnmodified: true
  };
}

export function mapPackageToPageFeed(pkg: AcpPackage, pageId: string): PageFeedMapping {
  if (!pkg.execution) {
    return {
      ok: false,
      code: "malformed_execution_data",
      message: "Package is not execution-ready. DGIX will not infer Facebook fields."
    };
  }
  return mapAcpToPageFeed(pkg.execution, pageId);
}

export async function executePageFeedPost(
  mapping: Extract<PageFeedMapping, { ok: true }>,
  pageAccessToken: string,
  post: GraphPostFn = graphPost
): Promise<
  | { ok: true; externalObjectId: string; raw: Record<string, unknown> }
  | { ok: false; code: string; message: string }
> {
  const result: MetaGraphResult<Record<string, unknown>> = await post(
    mapping.apiPath,
    mapping.fields,
    pageAccessToken
  );
  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message };
  }
  const id = typeof result.value.id === "string" ? result.value.id.trim() : "";
  if (!id) {
    return {
      ok: false,
      code: "meta_api_error",
      message: "Meta did not return a Facebook object id. DGIX did not mark this ACP as executed."
    };
  }
  return { ok: true, externalObjectId: id, raw: result.value };
}

export { FACEBOOK_ORGANIC_ADAPTER, ORGANIC_PAGE_FEED_OPERATION };
