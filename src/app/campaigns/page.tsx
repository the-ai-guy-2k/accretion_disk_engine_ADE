"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoopStrip } from "@/components/WorkflowStrip";

type Campaign = {
  id: number;
  title: string;
  objective: string;
  status: string;
  goal_id: number;
  goal_title: string;
  is_test: number;
  start_date: string | null;
  end_date: string | null;
  source_count: number;
  plan_count: number;
  draft_count: number;
};

type Goal = { id: number; title: string };

function CampaignsInner() {
  const params = useSearchParams();
  const preGoal = params.get("goalId") || "";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "ADE Awareness Campaign",
    objective: "Turn selected source material into a small coordinated content plan that supports Audience Network growth.",
    goal_id: preGoal,
    start_date: "",
    end_date: "",
    status: "planning",
    is_test: true
  });

  async function load() {
    const [campRes, goalRes] = await Promise.all([fetch("/api/campaigns"), fetch("/api/goals")]);
    const campData = await campRes.json();
    const goalData = await goalRes.json();
    if (!campData.ok) {
      setError(campData.error);
      return;
    }
    setCampaigns(campData.campaigns);
    if (goalData.ok) {
      setGoals(goalData.goals);
      if (!form.goal_id && goalData.goals[0]) {
        setForm((current) => ({ ...current, goal_id: String(goalData.goals[0].id) }));
      }
    }
    setError("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        goal_id: Number(form.goal_id)
      })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    window.location.href = `/campaigns/${data.campaign.id}`;
  }

  return (
    <section>
      <LoopStrip current="Campaigns" />
      <h1>Campaigns</h1>
      <p className="lede">
        Tell ADE what the Goal is, then generate a content plan and drafts from selected
        Sources. Human review is still required before anything can be published.
      </p>
      <div className="split">
        <form className="panel form-grid" onSubmit={(event) => void create(event)}>
          <h2>New Campaign</h2>
          <label>
            Associated Goal
            <select
              value={form.goal_id}
              onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
              required
            >
              <option value="">Select a Goal…</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  #{goal.id} {goal.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Objective
            <textarea
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </label>
          <label>
            Start (optional)
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </label>
          <label>
            End (optional)
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
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
            <button className="primary" type="submit" disabled={!form.goal_id}>
              Create Campaign
            </button>
          </div>
        </form>
        <div className="panel">
          <h2>Stored Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="muted">No campaigns yet. Create one from a Goal.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Goal</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link href={`/campaigns/${campaign.id}`}>{campaign.title}</Link>
                      {campaign.is_test ? <p className="muted">TEST DATA</p> : null}
                    </td>
                    <td>{campaign.goal_title}</td>
                    <td>
                      {campaign.status} · {campaign.source_count} sources · {campaign.draft_count} drafts
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

export default function CampaignsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading campaigns…</p>}>
      <CampaignsInner />
    </Suspense>
  );
}
