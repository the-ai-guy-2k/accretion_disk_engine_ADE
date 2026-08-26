"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoopStrip, Provenance } from "@/components/WorkflowStrip";

type Source = {
  id: number;
  title: string;
  source_type: string;
  provenance: string;
  is_test: number;
};

type PlanItem = {
  id: number;
  sequence: number;
  title: string;
  purpose: string;
  format: string;
  intended_audience: string;
  suggested_timing: string;
  source_id: number;
  source_title: string;
  content_id: number | null;
  draft_status: string | null;
};

type Draft = {
  id: number;
  title: string;
  status: string;
  source_id: number;
  source_title: string;
  campaign_title: string;
  goal_title: string;
  is_test: number;
};

type Workspace = {
  campaign: {
    id: number;
    title: string;
    objective: string;
    status: string;
    goal_id: number;
    goal_title: string;
    start_date: string | null;
    end_date: string | null;
    is_test: number;
    plan_summary: string | null;
    plan_mode: string | null;
  };
  sources: Source[];
  planItems: PlanItem[];
  drafts: Draft[];
  publications: { id: number; status: string; content_title: string; source_id: number }[];
  approvalCounts: { draft: number; rejected: number; approved: number };
  results: { totals: { metric_name: string; value: number; capture_method: string }[]; captureNote: string };
  banners: { plan: string; generation: string };
};

export default function CampaignWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const [wsRes, sourceRes] = await Promise.all([
      fetch(`/api/campaigns/${id}/workspace`),
      fetch("/api/sources")
    ]);
    const wsData = await wsRes.json();
    const sourceData = await sourceRes.json();
    if (!wsData.ok) {
      setError(wsData.error);
      return;
    }
    setWorkspace(wsData.workspace);
    setSelected(wsData.workspace.sources.map((source: Source) => source.id));
    if (sourceData.ok) setAllSources(sourceData.sources);
    setError("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveSources() {
    const res = await fetch(`/api/campaigns/${id}/sources`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ids: selected })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice("Sources saved.");
    await load();
  }

  async function generatePlan() {
    const res = await fetch(`/api/campaigns/${id}/plan`, { method: "POST" });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice("Content plan generated. Human review is still required.");
    await load();
  }

  async function generateDrafts() {
    const res = await fetch(`/api/campaigns/${id}/drafts`, { method: "POST" });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice(`${data.created?.length || 0} draft(s) created. Approve them in Review before publishing.`);
    await load();
  }

  if (!workspace) {
    return <p className="muted">Loading campaign workspace…</p>;
  }

  const campaign = workspace.campaign;

  return (
    <section>
      <LoopStrip current="Campaigns" />
      <h1>{campaign.title}</h1>
      <p className="lede">
        Goal #{campaign.goal_id} {campaign.goal_title}. Status: {campaign.status}
        {campaign.is_test ? " · TEST DATA" : ""}.
      </p>
      <div className="banner">{workspace.banners.plan}</div>
      <div className="grid">
        <article className="card">
          <h2>Objective</h2>
          <p>{campaign.objective || "(none)"}</p>
          <p className="muted">
            {campaign.start_date || "No start"} → {campaign.end_date || "No end"}
          </p>
          <Link href="/goals">Open Goal</Link>
        </article>
        <article className="card">
          <h2>Approval state</h2>
          <p>
            Draft {workspace.approvalCounts.draft} · Rejected {workspace.approvalCounts.rejected} ·
            Approved {workspace.approvalCounts.approved}
          </p>
          <Link href="/review">Open Review</Link>
        </article>
        <article className="card">
          <h2>Publishing state</h2>
          {workspace.publications.length === 0 ? (
            <p className="muted">No queue items until a draft is approved.</p>
          ) : (
            <ul className="evidence-list">
              {workspace.publications.map((row) => (
                <li key={row.id}>
                  #{row.id} {row.content_title}: {row.status}
                </li>
              ))}
            </ul>
          )}
          <Link href="/publishing">Open queue</Link>
        </article>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Selected Sources</h2>
        <p className="muted">ADE may only plan from sources you attach to this Campaign.</p>
        <div className="form-grid">
          {allSources.map((source) => (
            <label key={source.id}>
              <input
                type="checkbox"
                checked={selected.includes(source.id)}
                onChange={(e) => {
                  setSelected((current) =>
                    e.target.checked
                      ? [...current, source.id]
                      : current.filter((value) => value !== source.id)
                  );
                }}
              />{" "}
              #{source.id} {source.title}
              {source.is_test ? " · TEST DATA" : ""}
            </label>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={() => void saveSources()}>
            Save sources
          </button>
          <button className="primary" type="button" onClick={() => void generatePlan()}>
            Generate content plan
          </button>
          <button type="button" onClick={() => void generateDrafts()}>
            Generate drafts from plan
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="status-ok">{notice}</p> : null}
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Content plan</h2>
        <p className="muted">{campaign.plan_summary || "No plan yet."}</p>
        {workspace.planItems.length === 0 ? (
          <p className="muted">Generate a plan after selecting sources.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Planned post</th>
                <th>Source</th>
                <th>Draft</th>
              </tr>
            </thead>
            <tbody>
              {workspace.planItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.sequence}</td>
                  <td>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      {item.purpose} · {item.format} · {item.suggested_timing}
                    </p>
                    <p className="muted">{item.intended_audience}</p>
                  </td>
                  <td>
                    <Provenance
                      sourceId={item.source_id}
                      sourceTitle={item.source_title}
                      isTest={workspace.sources.find((source) => source.id === item.source_id)?.is_test}
                    />
                  </td>
                  <td>
                    {item.content_id ? (
                      <Link href={`/review?id=${item.content_id}`}>
                        #{item.content_id} {item.draft_status}
                      </Link>
                    ) : (
                      "Not drafted"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Drafts</h2>
        <div className="banner">{workspace.banners.generation}</div>
        {workspace.drafts.length === 0 ? (
          <p className="muted">No drafts yet. Generate them from the plan.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Draft</th>
                <th>Status</th>
                <th>Supports</th>
              </tr>
            </thead>
            <tbody>
              {workspace.drafts.map((draft) => (
                <tr key={draft.id}>
                  <td>
                    <Link href={`/review?id=${draft.id}`}>{draft.title}</Link>
                  </td>
                  <td>{draft.status}</td>
                  <td>
                    Goal: {draft.goal_title || campaign.goal_title} · Campaign: {draft.campaign_title || campaign.title} ·
                    Source #{draft.source_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Available results</h2>
        <p className="muted">{workspace.results.captureNote}</p>
        {workspace.results.totals.length === 0 ? (
          <p className="muted">No publication results for this Campaign yet.</p>
        ) : (
          <ul className="evidence-list">
            {workspace.results.totals.map((row) => (
              <li key={row.metric_name}>
                {row.metric_name}: {row.value} ({row.capture_method})
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
