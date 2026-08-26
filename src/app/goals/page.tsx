"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JourneyStrip } from "@/components/WorkflowStrip";

type Goal = {
  id: number;
  title: string;
  description: string;
  status: string;
  target_metric: string;
  starting_value: number;
  target_value: number | null;
  target_date: string | null;
  is_test: number;
  progress: {
    starting: number;
    target: number | null;
    contributed: number;
    current: number;
    remaining: number | null;
    percent: number | null;
    achieved: boolean;
  };
};

const EMPTY_FORM = {
  title: "",
  description: "",
  target_metric: "leads_generated",
  starting_value: "0",
  target_value: "2",
  target_date: "",
  status: "active",
  is_test: true
};

function ProgressBar({ percent }: { percent: number | null }) {
  const width = Math.min(100, Math.round((percent ?? 0) * 100));
  return (
    <div className="progress" aria-label="Goal progress">
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metricLabels, setMetricLabels] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<string[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const res = await fetch("/api/goals");
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setGoals(data.goals);
    setMetricLabels(data.metricLabels || {});
    setStatuses(data.statuses || ["active", "paused", "achieved", "archived"]);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        starting_value: Number(form.starting_value),
        target_value: form.target_value === "" ? null : Number(form.target_value)
      })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice("Goal saved. Next: create a Campaign for this Goal.");
    setForm(EMPTY_FORM);
    await load();
  }

  async function setStatus(id: number, status: string) {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    await load();
  }

  return (
    <section>
      <JourneyStrip current="Goal" />
      <h1>Goals</h1>
      <p className="lede">
        State the social-media objective. Progress comes from operator-entered results
        on published content linked to the Goal — not from Facebook analytics.
      </p>
      <div className="split">
        <form className="panel form-grid" onSubmit={(event) => void create(event)}>
          <h2>New Goal</h2>
          <label>
            Name
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Increase TAIG client contacts through Facebook by 2"
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="TEST DATA if this is a validation Goal. Do not treat ADE as having created real clients."
            />
          </label>
          <label>
            Metric
            <select
              value={form.target_metric}
              onChange={(e) => setForm({ ...form, target_metric: e.target.value })}
            >
              {Object.keys(metricLabels).length
                ? Object.entries(metricLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))
                : (
                    <option value="audience_network_gained">Audience Network gained</option>
                  )}
            </select>
          </label>
          <label>
            Starting value
            <input
              type="number"
              value={form.starting_value}
              onChange={(e) => setForm({ ...form, starting_value: e.target.value })}
            />
          </label>
          <label>
            Target value
            <input
              type="number"
              value={form.target_value}
              onChange={(e) => setForm({ ...form, target_value: e.target.value })}
            />
          </label>
          <label>
            Target date (optional)
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
          {notice ? <p className="status-ok">{notice}</p> : null}
          <div className="actions">
            <button className="primary" type="submit">
              Save Goal
            </button>
            {notice ? <Link href="/campaigns">Create Campaign</Link> : null}
          </div>
        </form>
        <div className="panel">
          <h2>Stored Goals</h2>
          {goals.length === 0 ? (
            <p className="muted">No goals yet. Create one to start the feedback loop.</p>
          ) : (
            goals.map((goal) => (
              <article key={goal.id} style={{ marginBottom: "1rem" }}>
                <p className="placeholder-flag">
                  {goal.status}
                  {goal.is_test ? " · TEST DATA" : ""}
                </p>
                <h2>{goal.title}</h2>
                <p className="muted">
                  {metricLabels[goal.target_metric] || goal.target_metric}: {goal.progress.current}
                  {goal.progress.target != null ? ` / ${goal.progress.target}` : ""}
                  {goal.target_date ? ` · target ${goal.target_date}` : ""}
                </p>
                <ProgressBar percent={goal.progress.percent} />
                <p className="muted">{goal.description}</p>
                <div className="actions">
                  <Link href={`/campaigns?goalId=${goal.id}`}>Next: create Campaign</Link>
                  <Link href={`/sources?goalId=${goal.id}`}>Add a Source</Link>
                  <Link href={`/analytics?goalId=${goal.id}`}>View results</Link>
                  {statuses
                    .filter((status) => status !== goal.status)
                    .map((status) => (
                    <button key={status} type="button" onClick={() => void setStatus(goal.id, status)}>
                      Mark {status}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
