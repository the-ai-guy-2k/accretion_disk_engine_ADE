import {
  aiApiKey,
  aiBaseUrl,
  aiModel,
  aiTimeoutMs
} from "@/lib/ai-config";
import {
  classifyHttpFailure,
  failure,
  type AiContentProvider,
  type AiGenerateResult
} from "@/lib/ai-provider";
import { parseGeneratedJson } from "@/lib/ai-prompt";

export const openaiContentProvider: AiContentProvider = {
  id: "openai",
  async generate({ systemPrompt, userPrompt, model, timeoutMs }): Promise<AiGenerateResult> {
    const key = aiApiKey();
    if (!key) {
      return failure(
        "missing_credentials",
        "AI generation is not configured. Set ADE_AI_API_KEY in .env.local (OpenAI may use OPENAI_API_KEY) and restart ADE.",
        503
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || aiTimeoutMs());
    try {
      const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || aiModel(),
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        return classifyHttpFailure(res.status, "OpenAI");
      }

      let payload: {
        choices?: { message?: { content?: string | null } }[];
        model?: string;
      };
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        return failure("malformed", "OpenAI returned a non-JSON response.", 502);
      }

      const content = payload.choices?.[0]?.message?.content;
      const parsed = parseGeneratedJson(String(content || ""));
      if (!parsed) {
        return failure(
          "malformed",
          "OpenAI returned a response ADE could not turn into a title and body. No draft was saved.",
          502
        );
      }

      return {
        ok: true,
        title: parsed.title,
        body: parsed.body,
        provider: "openai",
        model: String(payload.model || model || aiModel())
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return failure("timeout", "The AI provider timed out. No draft was saved.", 504);
      }
      return failure(
        "unavailable",
        "ADE could not reach the AI provider. Check the network and ADE_AI_BASE_URL. No draft was saved.",
        502
      );
    } finally {
      clearTimeout(timer);
    }
  }
};
