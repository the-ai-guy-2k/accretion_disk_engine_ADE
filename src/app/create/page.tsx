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
  is_test: number;
  goal_id: number | null;
  goal_title: string | null;
  effective_goal_id: number | null;
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

  const selected = useMemo(
    () => sources.find((source) => String(source.id) === sourceId),
    [sources, sourceId]
  );

  async function load() {
    const [sourceRes, contentRes, goalRes] = await Promise.all([
      fetch("/api/sources"),
      fetch("/api/content"),
      fetch("/api/goals")
    ]);
    const sourceData = await sourceRes.json();
    const contentData = await contentRes.json();
    const goalData = await goalRes.json();
    if (!sourceData.ok) {
      setError(sourceData.error);
      return;
    }
    setSources(sourceData.sources);
    setDrafts(contentData.content || []);
    if (goalData.ok) setGoals(goalData.goals);
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
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: Number(sourceId),
        goal_id: goalId ? Number(goalId) : undefined
      })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setError("");
    setNotice("Mock/manual draft created. It is not live AI output. Continue to Review.");
    await load();
  }

  return (
    <section>
      <WorkflowStrip current="Draft" />
      <h1>Create</h1>
      <p className="lede">
        Select a source and create a draft. Live AI is not required. ADE uses a
        clearly labeled mock/manual generation boundary.
      </p>
      <div className="banner">
        ADE MOCK / MANUAL GENERATION BOUNDARY — no AI provider credentials are used.
      </div>
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
        <div className="actions">
          <button className="primary" type="button" disabled={!sourceId} onClick={() => void createDraft()}>
            Create draft from source
          </button>
          <Link href="/review">Go to Review</Link>
        </div>
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
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
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
