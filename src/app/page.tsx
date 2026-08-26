"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FoundationStatus } from "@/components/FoundationStatus";
import { LoopStrip } from "@/components/WorkflowStrip";
import { PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";

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

export default function DashboardPage() {
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

  return (
    <section>
      <LoopStrip current="Goals" />
      <h1>{PRODUCT_NAME}</h1>
      <p className="lede">
        <strong>{PRODUCT_SHORT}</strong> operator hub:{" "}
        <strong>Goals → Campaigns → Decisions → Results</strong>. Publishing still follows Source →
        Draft → Review → Queue.
      </p>
      <FoundationStatus />
      <div className="grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <h2>Active Goal</h2>
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
                {goal.progress.current}
                {goal.progress.target != null ? ` / ${goal.progress.target}` : ""} · contributed{" "}
                {goal.progress.contributed}
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
          <h2>Campaigns</h2>
          <p>{summary ? `${summary.campaigns} stored` : "Loading…"}</p>
          <Link href="/campaigns">Open Campaigns</Link>
        </article>
        <article className="card">
          <h2>Content awaiting decisions</h2>
          <p>{summary ? `${summary.pendingReview} draft/rejected items` : "Loading…"}</p>
          <Link href="/review">Open review</Link>
        </article>
        <article className="card">
          <h2>Recent publication results</h2>
          {summary?.recentResults?.length ? (
            <ul className="evidence-list">
              {summary.recentResults.slice(0, 4).map((row) => (
                <li key={`${row.publication_id}-${row.metric_name}`}>
                  {row.content_title}: {row.metric_name} {row.numeric_value} ({row.capture_method})
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No operator-entered results yet.</p>
          )}
          <p>
            <Link href="/publishing">Open queue</Link>
          </p>
        </article>
        <article className="card">
          <h2>Latest ADE recommendation</h2>
          {rec ? (
            <>
              <p>{rec.action_hint || rec.summary}</p>
              <p className="muted">{rec.analysis_mode === "live_ai" ? "Live AI" : "Deterministic analysis"}</p>
              <Link href="/intelligence">Open Intelligence</Link>
            </>
          ) : (
            <>
              <p className="muted">No recommendation stored yet. Enter results, then analyze.</p>
              <Link href="/intelligence">Open Intelligence</Link>
            </>
          )}
        </article>
        <article className="card">
          <p className="placeholder-flag">Mock adapter</p>
          <h2>Facebook Channel 01</h2>
          <p className="muted">
            {summary?.adapter.label || "Manual / mock Facebook adapter"}. Not live Meta publishing.
          </p>
        </article>
      </div>
    </section>
  );
}
