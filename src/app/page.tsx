"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JourneyStrip } from "@/components/WorkflowStrip";
import { PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";
import { captureLabel, metricDisplay } from "@/lib/labels";

type Goal = {
  id: number;
  title: string;
  target_metric: string;
  is_test: number;
  progress: {
    current: number;
    target: number | null;
    contributed: number;
    percent: number | null;
  };
};

type Recommendation = {
  summary: string;
  action_hint: string;
  observed: string;
  analysis_mode: string;
  analysis_boundary_note: string;
};

type ResultRow = {
  publication_id: number;
  content_title: string;
  metric_name: string;
  numeric_value: number;
  capture_method: string;
};

type Summary = {
  sources: number;
  drafts: number;
  pendingReview: number;
  approved: number;
  queue: { PENDING: number; READY: number; PUBLISHED: number; FAILED: number };
  adapter: { id: string; isMock: boolean; label: string };
  activeGoal: Goal | null;
  latestRecommendation: Recommendation | null;
  recentResults: ResultRow[];
  campaigns: number;
};

function nextAction(summary: Summary | null): { href: string; label: string; why: string } {
  if (!summary) {
    return { href: "/goals", label: "Open Goals", why: "Start by stating what this work should accomplish." };
  }
  if (!summary.activeGoal) {
    return { href: "/goals", label: "Create a Goal", why: "ADE needs an objective before it can judge results." };
  }
  if (summary.campaigns < 1) {
    return {
      href: `/campaigns?goalId=${summary.activeGoal.id}`,
      label: "Create a Campaign",
      why: "A Campaign groups the content that should move the Goal."
    };
  }
  if (summary.sources < 1) {
    return {
      href: `/sources?goalId=${summary.activeGoal.id}`,
      label: "Add a Source",
      why: "Drafts are grounded in Source material you choose."
    };
  }
  if (summary.pendingReview > 0) {
    return {
      href: "/review",
      label: "Review drafts",
      why: `${summary.pendingReview} item(s) need your approve or reject decision. AI cannot skip this.`
    };
  }
  if (summary.queue.PENDING > 0 || summary.queue.READY > 0) {
    return {
      href: "/publishing",
      label: "Continue Publishing",
      why: "Approved items are waiting in the mock Facebook queue."
    };
  }
  if (summary.queue.PUBLISHED > 0 && !summary.recentResults?.length) {
    return {
      href: "/publishing",
      label: "Enter results",
      why: "Mock publish is complete. Enter performance numbers manually — ADE does not collect Facebook metrics."
    };
  }
  return {
    href: "/intelligence",
    label: "Open Intelligence",
    why: "Ask ADE for an evidence-grounded recommendation, or compute the deterministic baseline."
  };
}

export default function HubPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/workflow/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setSummary(data.summary);
      })
      .catch(() => undefined);
  }, []);

  const goal = summary?.activeGoal;
  const rec = summary?.latestRecommendation;
  const width = Math.min(100, Math.round((goal?.progress.percent ?? 0) * 100));
  const action = nextAction(summary);
  const needsDecision = (summary?.pendingReview || 0) + (summary?.queue.PENDING || 0) + (summary?.queue.READY || 0);

  return (
    <section>
      <JourneyStrip />
      <h1>{PRODUCT_SHORT} Hub</h1>
      <p className="lede">
        <strong>{PRODUCT_NAME}</strong> helps you move one objective through content,
        a human decision, mock publishing, measurement, and a recommendation.
        AI assists. You decide.
      </p>
      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Suggested next step</h2>
        <p>{action.why}</p>
        <p className="next-step">
          <Link href={action.href}>{action.label}</Link>
        </p>
      </div>
      <div className="grid">
        <article className="card">
          <h2>What you are trying to accomplish</h2>
          {goal ? (
            <>
              <p>
                {goal.title}
                {goal.is_test ? " · TEST DATA" : ""}
              </p>
              <div className="progress">
                <span style={{ width: `${width}%` }} />
              </div>
              <p className="muted">
                {metricDisplay(goal.target_metric)}: {goal.progress.current}
                {goal.progress.target != null ? ` / ${goal.progress.target}` : ""}
              </p>
              <Link href="/goals">Open Goals</Link>
            </>
          ) : (
            <>
              <p className="muted">No active Goal yet.</p>
              <Link href="/goals">Create a Goal</Link>
            </>
          )}
        </article>
        <article className="card">
          <h2>What is happening now</h2>
          {summary ? (
            <p>
              {summary.campaigns} campaign(s) · {summary.sources} source(s) · {summary.drafts}{" "}
              draft(s) · queue {summary.queue.PENDING} waiting, {summary.queue.READY} ready,{" "}
              {summary.queue.PUBLISHED} mock-published
              {summary.queue.FAILED ? `, ${summary.queue.FAILED} failed` : ""}.
            </p>
          ) : (
            <p className="muted">Loading…</p>
          )}
          <p className="muted">Publishing uses the mock Facebook adapter, not the Meta API.</p>
        </article>
        <article className="card">
          <h2>What needs your decision</h2>
          {needsDecision ? (
            <>
              <p>
                {summary?.pendingReview ? `${summary.pendingReview} draft(s) to review. ` : ""}
                {(summary?.queue.PENDING || 0) + (summary?.queue.READY || 0)
                  ? `${(summary?.queue.PENDING || 0) + (summary?.queue.READY || 0)} queue item(s) to move.`
                  : ""}
              </p>
              <Link href={summary?.pendingReview ? "/review" : "/publishing"}>
                {summary?.pendingReview ? "Open Review" : "Open Publishing"}
              </Link>
            </>
          ) : (
            <p className="muted">Nothing is waiting on a human decision right now.</p>
          )}
        </article>
        <article className="card">
          <h2>What happened recently</h2>
          {summary?.recentResults?.length ? (
            <ul className="evidence-list">
              {summary.recentResults.slice(0, 4).map((row) => (
                <li key={`${row.publication_id}-${row.metric_name}`}>
                  {row.content_title}: {metricDisplay(row.metric_name)} {row.numeric_value} (
                  {captureLabel(row.capture_method)})
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No operator-entered results yet. These are not Facebook-collected metrics.</p>
          )}
          <p>
            <Link href="/publishing">Open Publishing</Link>
            {" · "}
            <Link href="/analytics">Open Analytics</Link>
          </p>
        </article>
        <article className="card">
          <h2>What ADE recommends</h2>
          {rec ? (
            <>
              <p>{rec.action_hint || rec.summary}</p>
              <p className="muted">
                {rec.analysis_mode === "live_ai" ? "Live AI interpretation" : "Deterministic baseline"}{" "}
                — advisory, not a guaranteed outcome.
              </p>
              <Link href="/intelligence">Open Intelligence</Link>
            </>
          ) : (
            <>
              <p className="muted">No recommendation yet. Enter results, then run analysis.</p>
              <Link href="/intelligence">Open Intelligence</Link>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
