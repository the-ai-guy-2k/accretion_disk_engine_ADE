"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Provenance, WorkflowStrip } from "@/components/WorkflowStrip";

type Source = {
  id: number;
  title: string;
  body: string;
  source_type: string;
  activity_date: string;
  provenance: string;
  notes: string;
  is_test: number;
  goal_id: number | null;
  goal_title: string | null;
};

const TEST_SOURCE = {
  title: "[TEST DATA] TAIG localhost ADE vertical-slice activity",
  body: "TAIG stood up the Accretion Disk Engine localhost Hub so real project work can later become approved marketing content. This record is a clearly labeled test source for ACI-004. It does not claim a client, revenue, endorsement, or audience result.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "ACI-004 validation / ADE localhost workspace",
  notes: "TEST DATA only. Not a production marketing claim.",
  is_test: true
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    source_type: "taig_activity",
    activity_date: new Date().toISOString().slice(0, 10),
    provenance: "",
    notes: "",
    is_test: false,
    goal_id: ""
  });

  async function load() {
    const [sourceRes, goalRes] = await Promise.all([fetch("/api/sources"), fetch("/api/goals")]);
    const data = await sourceRes.json();
    const goalData = await goalRes.json();
    if (!data.ok) {
      setError(data.error || "Failed to load sources");
      return;
    }
    setSources(data.sources);
    if (goalData.ok) setGoals(goalData.goals);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const goalId = params.get("goalId");
    if (goalId) {
      setForm((current) => ({ ...current, goal_id: goalId }));
    }
  }, []);

  async function create(payload: Record<string, unknown>) {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Create failed");
      return;
    }
    await load();
  }

  return (
    <section>
      <WorkflowStrip current="Source" />
      <h1>Sources</h1>
      <p className="lede">
        Real activity that may later become content. Optionally associate a source with a
        Goal so later drafts and publications stay on that objective.
      </p>
      <div className="split">
        <form
          className="panel form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void create({
              ...form,
              goal_id: form.goal_id ? Number(form.goal_id) : null
            });
          }}
        >
          <h2>New source</h2>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Source content / description
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label>
            Source type
            <select
              value={form.source_type}
              onChange={(e) => setForm({ ...form, source_type: e.target.value })}
            >
              <option value="taig_activity">taig_activity</option>
              <option value="client_result">client_result</option>
              <option value="informational">informational</option>
            </select>
          </label>
          <label>
            Goal (optional)
            <select
              value={form.goal_id}
              onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
            >
              <option value="">None</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  #{goal.id} {goal.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.activity_date}
              onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
            />
          </label>
          <label>
            Provenance / reference
            <input
              value={form.provenance}
              onChange={(e) => setForm({ ...form, provenance: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_test}
              onChange={(e) => setForm({ ...form, is_test: e.target.checked })}
            />{" "}
            Mark as TEST DATA
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="actions">
            <button className="primary" type="submit">
              Save source
            </button>
            <button
              type="button"
              onClick={() => void create(TEST_SOURCE)}
            >
              Load ACI-004 test source
            </button>
          </div>
        </form>
        <div className="panel">
          <h2>Existing sources</h2>
          {sources.length === 0 ? (
            <p className="muted">No sources yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Next</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.title}</strong>
                      <Provenance
                        sourceId={source.id}
                        sourceTitle={source.title}
                        provenance={source.provenance}
                        isTest={source.is_test}
                      />
                      {source.goal_id ? (
                        <p className="muted">
                          Goal #{source.goal_id} {source.goal_title}
                        </p>
                      ) : (
                        <p className="muted">No Goal linked</p>
                      )}
                    </td>
                    <td>
                      <Link href={`/create?sourceId=${source.id}`}>Create draft</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
