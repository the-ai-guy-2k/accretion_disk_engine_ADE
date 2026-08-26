"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Provenance, WorkflowStrip } from "@/components/WorkflowStrip";

type Content = {
  id: number;
  title: string;
  body: string;
  status: string;
  source_id: number;
  source_title: string;
  source_body: string;
  source_provenance: string;
  source_is_test: number;
  generation_note: string;
  generation_mode: string;
  generation_provider: string | null;
  generation_model: string | null;
  effective_goal_id: number | null;
  goal_title: string | null;
  campaign_id: number | null;
  campaign_title: string | null;
  publication: { id: number; status: string } | null;
};

function ReviewInner() {
  const params = useSearchParams();
  const requested = params.get("id");
  const [items, setItems] = useState<Content[]>([]);
  const [current, setCurrent] = useState<Content | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [goalId, setGoalId] = useState("");
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(id?: string | null) {
    const listRes = await fetch("/api/content");
    const listData = await listRes.json();
    const goalRes = await fetch("/api/goals");
    const goalData = await goalRes.json();
    if (goalData.ok) setGoals(goalData.goals);
    if (!listData.ok) {
      setError(listData.error);
      return;
    }
    setItems(listData.content);
    const pick = id || requested || (listData.content[0] ? String(listData.content[0].id) : "");
    if (!pick) {
      setCurrent(null);
      return;
    }
    const res = await fetch(`/api/content/${pick}`);
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setCurrent(data.content);
    setTitle(data.content.title);
    setBody(data.content.body);
    setGoalId(data.content.effective_goal_id ? String(data.content.effective_goal_id) : "");
    setError("");
  }

  useEffect(() => {
    void load(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  async function save() {
    if (!current) return;
    const res = await fetch(`/api/content/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice("Draft saved.");
    await load(String(current.id));
  }

  async function act(action: string) {
    if (!current) return;
    const res = await fetch(`/api/content/${current.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice(`Decision recorded: ${action}.`);
    await load(String(current.id));
  }

  const nextDecision =
    current?.status === "approved"
      ? "Approved — in or eligible for the publishing queue."
      : current?.status === "rejected"
        ? "Rejected — return to draft or leave it out of the queue."
        : "Decision required: approve (queue) or reject.";

  return (
    <section>
      <WorkflowStrip current="Review" />
      <h1>Review</h1>
      <p className="lede">
        Human approval is mandatory. Unapproved content cannot enter the Facebook
        mock publishing queue.
      </p>
      <div className="split">
        <div className="panel">
          <h2>Items</h2>
          {items.length === 0 ? (
            <p className="muted">
              No drafts. <Link href="/create">Create one</Link>.
            </p>
          ) : (
            <table className="table">
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/review?id=${item.id}`}>#{item.id} {item.title}</Link>
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {current ? (
          <div className="panel form-grid">
            <p className="placeholder-flag">{nextDecision}</p>
            <Provenance
              sourceId={current.source_id}
              sourceTitle={current.source_title}
              provenance={current.source_provenance}
              isTest={current.source_is_test}
            />
            <p className="muted">
              Goal: {current.goal_title || (current.effective_goal_id ? `#${current.effective_goal_id}` : "none")}
              {current.campaign_id
                ? ` · Campaign #${current.campaign_id} ${current.campaign_title || ""}`
                : ""}
            </p>
            <label>
              Associate with Goal
              <select
                value={goalId}
                onChange={(e) => {
                  const value = e.target.value;
                  setGoalId(value);
                  void fetch(`/api/content/${current.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ goal_id: value ? Number(value) : null })
                  }).then(async (res) => {
                    const data = await res.json();
                    if (!data.ok) setError(data.error);
                    else await load(String(current.id));
                  });
                }}
              >
                <option value="">None</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    #{goal.id} {goal.title}
                  </option>
                ))}
              </select>
            </label>
            <h2>Source</h2>
            <pre className="draft">{current.source_body || "(empty source body)"}</pre>
            <h2>Draft</h2>
            <p className="muted">{current.generation_note}</p>
            {current.generation_mode === "live_ai" ? (
              <div className="banner">
                AI-assisted draft ({current.generation_provider || "provider"}
                {current.generation_model ? ` / ${current.generation_model}` : ""}).
                Edit, then approve or reject. ADE will not auto-publish.
              </div>
            ) : (
              <div className="banner">
                Mock/manual draft — not live AI output.
              </div>
            )}
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Body
              <textarea value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            {error ? <p className="error">{error}</p> : null}
            {notice ? <p className="status-ok">{notice}</p> : null}
            <div className="actions">
              <button type="button" onClick={() => void save()}>
                Save edits
              </button>
              <button className="primary" type="button" onClick={() => void act("approve")}>
                Approve into queue
              </button>
              <button className="danger" type="button" onClick={() => void act("reject")}>
                Reject
              </button>
              <button type="button" onClick={() => void act("return_to_draft")}>
                Return to draft
              </button>
              <Link href="/publishing">Open publishing queue</Link>
            </div>
            {current.publication ? (
              <p className="muted">
                Latest publication #{current.publication.id}: {current.publication.status}
              </p>
            ) : (
              <p className="muted">No publication row until approval.</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="muted">Loading review…</p>}>
      <ReviewInner />
    </Suspense>
  );
}
