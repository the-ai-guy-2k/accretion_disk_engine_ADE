export const MOCK_GENERATION_BANNER =
  "ADE MOCK / MANUAL GENERATION BOUNDARY — this draft was not produced by a live AI provider.";

export const MOCK_FACEBOOK_BANNER =
  "NOT REAL FACEBOOK PUBLISHING — Channel 01 uses the ADE manual/mock adapter. No Meta API call is made.";

export type ChannelPublishInput = {
  publicationId: number;
  contentId: number;
  sourceId: number | null;
  title: string;
  body: string;
};

export type ChannelPublishResult = {
  ok: boolean;
  adapterId: "manual_facebook";
  isMock: true;
  channelType: "facebook";
  message: string;
  externalPostId?: string;
  failureReason?: string;
};

export interface ChannelAdapter {
  id: "manual_facebook";
  channelType: "facebook";
  isMock: true;
  label: string;
  accept(input: ChannelPublishInput): ChannelPublishResult;
  confirm(input: ChannelPublishInput): ChannelPublishResult;
  fail(input: ChannelPublishInput, reason: string): ChannelPublishResult;
}

export const manualFacebookAdapter: ChannelAdapter = {
  id: "manual_facebook",
  channelType: "facebook",
  isMock: true,
  label: "Manual / Mock Facebook Adapter (Channel 01)",
  accept(input) {
    return {
      ok: true,
      adapterId: "manual_facebook",
      isMock: true,
      channelType: "facebook",
      message: `${MOCK_FACEBOOK_BANNER} Payload accepted for publication #${input.publicationId} (content #${input.contentId}). Operator must confirm or fail this mock attempt.`
    };
  },
  confirm(input) {
    return {
      ok: true,
      adapterId: "manual_facebook",
      isMock: true,
      channelType: "facebook",
      externalPostId: `mock-fb-${input.publicationId}-${Date.now()}`,
      message: `${MOCK_FACEBOOK_BANNER} Controlled test result: mock published. This is not a Facebook post.`
    };
  },
  fail(input, reason) {
    return {
      ok: false,
      adapterId: "manual_facebook",
      isMock: true,
      channelType: "facebook",
      failureReason: reason,
      message: `${MOCK_FACEBOOK_BANNER} Controlled test result: FAILED. Publication #${input.publicationId} is not published.`
    };
  }
};

export function buildMockDraft(source: {
  id: number;
  title: string;
  body?: string | null;
  provenance?: string | null;
  is_test?: number;
}): { title: string; body: string; generation_mode: "mock_manual"; generation_note: string } {
  const excerpt = (source.body ?? "").trim() || "(No source body provided.)";
  const testPrefix = source.is_test ? "[TEST DATA] " : "";
  return {
    title: `${testPrefix}Draft from source: ${source.title}`.slice(0, 180),
    body: [
      MOCK_GENERATION_BANNER,
      "",
      `Source id: ${source.id}`,
      `Source title: ${source.title}`,
      `Provenance: ${source.provenance || "(none)"}`,
      "",
      "Operator-editable draft based on the source (not a live model output):",
      excerpt
    ].join("\n"),
    generation_mode: "mock_manual",
    generation_note: MOCK_GENERATION_BANNER
  };
}
