"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoopStrip } from "@/components/WorkflowStrip";

type Scored = {
  publicationId: number;
  contentId: number;
  title: string;
  sourceTitle: string;
  materialKindLabel: string;
  captureMethod: string;
  hasResults: boolean;
  isTest: boolean;
  metrics: Record<string, number>;
  scores: { business: number; engagement: number; visibility: number; towardGoal: number };
};

type Analytics = {
  hierarchy: string;
  goal: {
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
  } | null;
  answers: {
    mostVisibility: Scored | null;
    mostEngagement: Scored | null;
    mostAudienceNetwork: Scored | null;
    goalProgressing: { yes: boolean; progress: { contributed: number } } | null;
    mostUsefulTowardGoal: Scored | null;
  };
  rankings: {
    visibility: Scored[];
    engagement: Scored[];
    audienceNetwork: Scored[];
    usefulTowardGoal: Scored[];
  };
};

function AnalyticsInner() {
  const params = useSearchParams();
  const requested = params.get("goalId") || "";
  const [goalId, setGoalId] = useState(requested);
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  async function load(id = goalId) {
    const query = id ? `?goal_id=${id}` : "";
    const [goalRes, analyticsRes] = await Promise.all([
      fetch("/api/goals"),
      fetch(`/api/analytics${query}`)
    ]);
    const goalData = await goalRes.json();
    const analyticsData = await analyticsRes.json();
    if (!goalData.ok) {
      setError(goalData.error);
      return;
    }
    if (!analyticsData.ok) {
      setError(analyticsData.error);
      return;
    }
    setGoals(goalData.goals);
    setAnalytics(analyticsData.analytics);
    setBanner(analyticsData.banner);
    setError("");
  }

  useEffect(() => {
    void load(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  const goal = analytics?.goal;
  const width = Math.min(100, Math.round((goal?.progress.percent ?? 0) * 100));

  return (
    <section>
      <LoopStrip current="Results" />
      <h1>Analytics</h1>
      <p className="lede">
        Decision support only. Hierarchy: <strong>Business Outcomes &gt; Meaningful Engagement &gt; Raw Visibility</strong>.
      </p>
      {banner ? <div className="banner">{banner}</div> : null}
      <div className="panel form-grid" style={{ marginBottom: "1rem" }}>
        <label>
          Goal
          <select
            value={goalId}
            onChange={(e) => {
              setGoalId(e.target.value);
              void load(e.target.value);
            }}
          >
            <option value="">Active Goal (default)</option>
            {goals.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} {item.title}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
      </div>
      {goal ? (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <h2>Is the Goal progressing?</h2>
          <p>
            {goal.title}
            {goal.is_test ? " · TEST DATA" : ""} — {goal.progress.current}
            {goal.progress.target != null ? ` / ${goal.progress.target}` : ""}
          </p>
          <div className="progress">
            <span style={{ width: `${width}%` }} />
          </div>
          <p className="muted">
            {analytics?.answers.goalProgressing?.yes
              ? "Yes — operator-entered results have contributed to the target metric."
              : "Not yet — no contributing results are recorded for this Goal."}
          </p>
        </div>
      ) : (
        <p className="muted">
          No Goal selected. <Link href="/goals">Create one</Link>.
        </p>
      )}
      <div className="grid">
        <AnswerCard
          title="Most visibility"
          item={analytics?.answers.mostVisibility}
          detail={(item) => `visibility score ${item.scores.visibility}`}
        />
        <AnswerCard
          title="Most meaningful engagement"
          item={analytics?.answers.mostEngagement}
          detail={(item) => `engagement score ${item.scores.engagement}`}
        />
        <AnswerCard
          title="Most Audience Network growth"
          item={analytics?.answers.mostAudienceNetwork}
          detail={(item) => `AN ${item.metrics.audience_network_gained || 0}`}
        />
        <AnswerCard
          title="Most useful toward the Goal"
          item={analytics?.answers.mostUsefulTowardGoal}
          detail={(item) =>
            `goal metric ${item.scores.towardGoal} · outcomes ${item.scores.business}`
          }
        />
      </div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Goal-linked published content</h2>
        {(analytics?.rankings.usefulTowardGoal || []).length === 0 ? (
          <p className="muted">No published results linked to this Goal yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Kind</th>
                <th>Toward goal</th>
                <th>Capture</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.rankings.usefulTowardGoal || []).map((item) => (
                <tr key={item.publicationId}>
                  <td>
                    {item.title}
                    {item.isTest ? " · TEST DATA" : ""}
                  </td>
                  <td>{item.materialKindLabel}</td>
                  <td>{item.scores.towardGoal}</td>
                  <td>{item.captureMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p>
          <Link href="/intelligence">Open Intelligence</Link>
        </p>
      </div>
    </section>
  );
}

function AnswerCard({
  title,
  item,
  detail
}: {
  title: string;
  item?: Scored | null;
  detail: (item: Scored) => string;
}) {
  return (
    <article className="card">
      <h2>{title}</h2>
      {item ? (
        <>
          <p>{item.title}</p>
          <p className="muted">{detail(item)}</p>
        </>
      ) : (
        <p className="muted">No entered results yet.</p>
      )}
    </article>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading analytics…</p>}>
      <AnalyticsInner />
    </Suspense>
  );
}
