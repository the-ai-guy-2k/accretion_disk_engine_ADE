"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoopStrip } from "@/components/WorkflowStrip";

type Evidence = {
  publicationId: number;
  contentId: number;
  title: string;
  metric: string;
  value: number;
  captureMethod: string;
};

type Recommendation = {
  id: number;
  summary: string;
  observed: string;
  why_it_matters: string;
  action_hint: string;
  analysis_mode: string;
  analysis_boundary_note: string;
  goal_id: number | null;
  evidence: Evidence[];
  liveAiUsed: boolean;
  is_test: number;
};

export default function IntelligencePage() {
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [goalId, setGoalId] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  async function load(id = goalId) {
    const query = id ? `?goal_id=${id}` : "";
    const [goalRes, intelRes] = await Promise.all([
      fetch("/api/goals"),
      fetch(`/api/intelligence${query}`)
    ]);
    const goalData = await goalRes.json();
    const intelData = await intelRes.json();
    if (!goalData.ok) {
      setError(goalData.error);
      return;
    }
    if (!intelData.ok) {
      setError(intelData.error);
      return;
    }
    setGoals(goalData.goals);
    setRecommendation(intelData.recommendation);
    setBanner(intelData.banner);
    setError("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    const res = await fetch("/api/intelligence/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goalId ? Number(goalId) : undefined,
        is_test: true
      })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setRecommendation(data.recommendation);
    setBanner(data.banner);
    setError("");
  }

  return (
    <section>
      <LoopStrip current="Results" />
      <h1>Intelligence</h1>
      <p className="lede">
        What ADE observed, why it matters, and the recommended next action — only from
        persisted Goal, content, and result evidence.
      </p>
      <div className="banner">{banner || "Analysis has not been run yet."}</div>
      <div className="panel form-grid">
        <label>
          Goal
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Active Goal (default)</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                #{goal.id} {goal.title}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button className="primary" type="button" onClick={() => void analyze()}>
            Analyze from persisted evidence
          </button>
          <Link href="/analytics">Open Analytics</Link>
        </div>
      </div>
      {recommendation ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <p className="placeholder-flag">
            {recommendation.liveAiUsed ? "Live AI" : "Deterministic / mock analysis"}
            {recommendation.is_test ? " · TEST DATA" : ""}
            {recommendation.goal_id ? ` · Goal #${recommendation.goal_id}` : ""}
          </p>
          <h2>Observed</h2>
          <p>{recommendation.observed}</p>
          <h2>Why it matters</h2>
          <p>{recommendation.why_it_matters}</p>
          <h2>Recommended next action</h2>
          <p>{recommendation.action_hint}</p>
          <h2>Evidence</h2>
          {recommendation.evidence?.length ? (
            <ul className="evidence-list">
              {recommendation.evidence.map((item) => (
                <li key={`${item.publicationId}-${item.metric}`}>
                  Publication #{item.publicationId} “{item.title}”: {item.metric} = {item.value} (
                  {item.captureMethod})
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No metric evidence was available for this recommendation.</p>
          )}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: "1rem" }}>
          No stored recommendation. Enter publication results, then run analysis.
        </p>
      )}
    </section>
  );
}
