"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Provenance, WorkflowStrip } from "@/components/WorkflowStrip";

type Source = {
  id: number;
  title: string;
  provenance: string;
  is_test: number;
  goal_id: number | null;
  goal_title: string | null;
};

type Content = {
  id: number;
  title: string;
  status: string;
  source_id: number;
  source_title: string;
  generation_mode: string;
  generation_status: string | null;
  is_test: number;
  goal_id: number | null;
  goal_title: string | null;
  effective_goal_id: number | null;
};

type AiStatus = {
  configured: boolean;
  ready: boolean;
  provider: string;
  model: string;
  unavailableReason: string | null;
  analyticsLive: boolean;
};

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="muted">Loading create…</p>}>
      <CreateInner />
    </Suspense>
  );
}

function CreateInner() {
  const params = useSearchParams();
  const preselect = params.get("sourceId") || "";
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceId, setSourceId] = useState(preselect);
  const [goalId, setGoalId] = useState("");
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [drafts, setDrafts] = useState<Content[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"mock" | "ai" | "">("");
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [platform, setPlatform] = useState("facebook");
  const [purpose, setPurpose] = useState("Invite readers to engage with the source topic");
  const [tone, setTone] = useState("professional and clear");
  const [length, setLength] = useState("short Facebook post");
  const [instruction, setInstruction] = useState("");

  const selected = useMemo(
    () => sources.find((source) => String(source.id) === sourceId),
    [sources, sourceId]
  );

  async function load() {
    const [sourceRes, contentRes, goalRes, aiRes] = await Promise.all([
      fetch("/api/sources"),
      fetch("/api/content"),
      fetch("/api/goals"),
      fetch("/api/ai/status")
    ]);
    const sourceData = await sourceRes.json();
    const contentData = await contentRes.json();
    const goalData = await goalRes.json();
    const aiData = await aiRes.json();
    if (!sourceData.ok) {
      setError(sourceData.error);
      return;
    }
    setSources(sourceData.sources);
    setDrafts(contentData.content || []);
    if (goalData.ok) setGoals(goalData.goals);
    if (aiData.ok) setAi(aiData.ai);
    if (!sourceId && sourceData.sources[0]) {
      setSourceId(String(sourceData.sources[0].id));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDraft() {
    setNotice("");
    setBusy("mock");
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: Number(sourceId),
        goal_id: goalId ? Number(goalId) : undefined
      })
    });
    const data = await res.json();
    setBusy("");
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setError("");
    setNotice("Mock/manual draft created. It is not live AI output. Continue to Review.");
    await load();
  }

  async function generateWithAi() {
    setNotice("");
    setBusy("ai");
    const res = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: Number(sourceId),
        goal_id: goalId ? Number(goalId) : undefined,
        platform,
        purpose,
        tone,
        length,
        extra_instruction: instruction
      })
    });
    const data = await res.json();
    setBusy("");
    if (!data.ok) {
      setError(data.error || "AI generation failed. No draft was saved.");
      return;
    }
    setError("");
    setNotice(
      `AI draft #${data.content.id} saved as a draft. It is not published. Continue to Review to edit, approve, or reject.`
    );
    await load();
  }

  const aiReady = Boolean(ai?.ready && sourceId && busy === "");

  return (
    <section>
      <WorkflowStrip current="Draft" />
      <h1>Create</h1>
      <p className="lede">
        Select a source and create a draft. Generate with AI uses ADE source
        material and an AI provider. Every draft still needs human review before
        it can enter the publishing queue.
      </p>
      <div className="panel form-grid">
        <label>
          Source
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select a source…</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                #{source.id} {source.title}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <Provenance
            sourceId={selected.id}
            sourceTitle={selected.title}
            provenance={selected.provenance}
            isTest={selected.is_test}
          />
        ) : (
          <p className="muted">
            No source selected. <Link href="/sources">Create one first</Link>.
          </p>
        )}
        <label>
          Goal (optional; defaults from source)
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Use source Goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                #{goal.id} {goal.title}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="status-ok">{notice}</p> : null}
      </div>

      <div className="panel form-grid" style={{ marginTop: "1rem" }}>
        <h2>Generate with AI</h2>
        {ai?.ready ? (
          <div className="banner">
            Live AI content generation is configured ({ai.provider} / {ai.model}).
            The same credentials can be used on Intelligence for live AI analysis.
          </div>
        ) : (
          <div className="banner">
            {ai?.unavailableReason ||
              "Live AI is not ready. Set ADE_AI_API_KEY in .env.local and restart ADE."}
          </div>
        )}
        <label>
          Target platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X / Twitter</option>
          </select>
        </label>
        <label>
          Purpose / objective
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. invite the audience to a TAIG session"
          />
        </label>
        <label>
          Tone
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="professional and clear">Professional and clear</option>
            <option value="friendly and inviting">Friendly and inviting</option>
            <option value="direct and concise">Direct and concise</option>
          </select>
        </label>
        <label>
          Length / format
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            <option value="short Facebook post">Short post</option>
            <option value="medium post, a few short paragraphs">Medium post</option>
          </select>
        </label>
        <label>
          Additional instruction (optional)
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Optional direction. ADE will not invent facts missing from the source."
          />
        </label>
        <div className="actions">
          <button
            className="primary"
            type="button"
            disabled={!aiReady}
            onClick={() => void generateWithAi()}
          >
            {busy === "ai" ? "Generating…" : "Generate with AI"}
          </button>
          <button type="button" disabled={!sourceId || busy !== ""} onClick={() => void createDraft()}>
            {busy === "mock" ? "Creating…" : "Create mock/manual draft"}
          </button>
          <Link href="/review">Go to Review</Link>
        </div>
        <p className="muted">
          AI-generated drafts are never auto-published. Approve or reject them in
          Review.
        </p>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Drafts</h2>
        {drafts.length === 0 ? (
          <p className="muted">No drafts yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Draft</th>
                <th>Status</th>
                <th>Generation</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                  <td>{item.generation_mode || "mock_manual"}</td>
                  <td>
                    #{item.source_id} {item.source_title}
                    {item.goal_title || item.effective_goal_id
                      ? ` · Goal ${item.goal_title || "#" + item.effective_goal_id}`
                      : ""}
                  </td>
                  <td>
                    <Link href={`/review?id=${item.id}`}>Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
