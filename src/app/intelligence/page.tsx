"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JourneyStrip } from "@/components/WorkflowStrip";
import { captureLabel, metricDisplay } from "@/lib/labels";

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
  campaign_id: number | null;
  evidence: Evidence[];
  liveAiUsed: boolean;
  is_test: number;
};

type AiStatus = {
  configured: boolean;
  ready: boolean;
  provider: string;
  model: string;
  analyticsLive: boolean;
  unavailableReason: string | null;
};

export default function IntelligencePage() {
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [goalId, setGoalId] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [baseline, setBaseline] = useState<{
    observed: string;
    whyItMatters: string;
    action: string;
  } | null>(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"deterministic" | "live_ai" | "">("");
  const [ai, setAi] = useState<AiStatus | null>(null);

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
    if (intelData.ai) setAi(intelData.ai);
    setError("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze(mode: "deterministic" | "live_ai") {
    setBusy(mode);
    const res = await fetch("/api/intelligence/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goalId ? Number(goalId) : undefined,
        is_test: true,
        mode
      })
    });
    const data = await res.json();
    setBusy("");
    if (!data.ok) {
      setError(data.error || "Analysis failed. Stored metrics and deterministic analytics were not changed.");
      return;
    }
    setRecommendation(data.recommendation);
    setBanner(data.banner);
    setBaseline(data.deterministicBaseline || null);
    setError("");
  }

  return (
    <section>
      <JourneyStrip current="Intelligence" />
      <h1>Intelligence</h1>
      <p className="lede">
        Observed evidence, meaning, and recommended next action. Rankings on Analytics
        stay calculated. Live AI adds interpretation of the same stored metrics — it
        does not invent Facebook numbers, and it is not a guaranteed outcome.
      </p>
      <div className="banner">{banner || "Analysis has not been run yet."}</div>
      {ai && !ai.analyticsLive ? (
        <p className="muted">
          Live AI analysis is unavailable. You can still compute the baseline. Open
          Settings if you expected live AI.
        </p>
      ) : null}
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
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void analyze("deterministic")}
          >
            {busy === "deterministic" ? "Computing…" : "Compute baseline"}
          </button>
          <button
            className="primary"
            type="button"
            disabled={busy !== "" || !ai?.analyticsLive}
            onClick={() => void analyze("live_ai")}
          >
            {busy === "live_ai" ? "Analyzing…" : "Analyze with AI"}
          </button>
          <Link href="/analytics">Open Analytics</Link>
        </div>
        <p className="muted">
          Recommendations are advisory. ADE does not auto-approve or auto-publish, and
          does not guarantee results.
        </p>
      </div>
      {recommendation ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <p className="placeholder-flag">
            {recommendation.liveAiUsed ? "Live AI analysis" : "Deterministic baseline"}
            {recommendation.is_test ? " · TEST DATA" : ""}
            {recommendation.goal_id ? ` · Goal #${recommendation.goal_id}` : ""}
            {recommendation.campaign_id ? ` · Campaign #${recommendation.campaign_id}` : ""}
          </p>
          <h2>Observed</h2>
          <p>{recommendation.observed}</p>
          <h2>Meaning</h2>
          <p>{recommendation.why_it_matters}</p>
          <h2>Recommended next action</h2>
          <p>{recommendation.action_hint}</p>
          {baseline && recommendation.liveAiUsed ? (
            <>
              <h2>Deterministic baseline (preserved)</h2>
              <p className="muted">{baseline.observed}</p>
            </>
          ) : null}
          <h2>Evidence</h2>
          {recommendation.evidence?.length ? (
            <ul className="evidence-list">
              {recommendation.evidence.map((item) => (
                <li key={`${item.publicationId}-${item.metric}`}>
                  Publication #{item.publicationId} “{item.title}”: {metricDisplay(item.metric)} = {item.value} (
                  {captureLabel(item.captureMethod)})
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
