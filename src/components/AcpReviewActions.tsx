"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExecutionView = {
  status: string;
  externalObjectId: string | null;
  attemptedAt: string;
  completedAt: string | null;
  sanitizedError: string | null;
  operation: string;
  pageId: string | null;
};

type Props = {
  intakeId: number;
  executionReady: boolean;
  reviewState: string;
  executionAuthorized: boolean;
  executionStatus: string | null;
  reviewStateLabel: string;
  canExecuteOrganic: boolean;
  latestExecution: ExecutionView | null;
  distributionType: string | null;
};

export function AcpReviewActions({
  intakeId,
  executionReady,
  reviewState,
  executionAuthorized,
  executionStatus,
  reviewStateLabel,
  canExecuteOrganic,
  latestExecution,
  distributionType
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const decided = reviewState === "authorized" || reviewState === "rejected";
  const authorizeBlocked = !executionReady || decided;
  const executed = executionStatus === "executed";
  const failed = executionStatus === "execution_failed";
  const paid = distributionType === "paid";

  async function post(path: string, body?: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || data.blockedReason || "Request failed.");
        if (data.banner) setNotice(data.banner);
        router.refresh();
        return;
      }
      setNotice(data.banner);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {notice ? <p className="status-ok">{notice}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!executionReady ? (
        <p className="error">
          This package is not execution-ready. It can be reviewed, but it cannot be
          authorized until an ACP with an execution block is imported.
        </p>
      ) : null}
      <div className="actions">
        <button
          className="primary"
          type="button"
          disabled={busy || authorizeBlocked}
          onClick={() =>
            void post(`/api/dgix/acp/${intakeId}/authorize`, { decision: "authorize" })
          }
        >
          Authorize execution
        </button>
        <button
          type="button"
          disabled={busy || reviewState === "rejected"}
          onClick={() =>
            void post(`/api/dgix/acp/${intakeId}/authorize`, { decision: "reject" })
          }
        >
          Reject package
        </button>
      </div>
      <p className="muted">
        Authorization tells DGIX it may later execute this package through a configured
        platform adapter. It does not publish to Facebook and does not use the Standard
        ADE mock publisher.
      </p>
      {executionAuthorized ? (
        <p className={executed ? "status-ok" : failed ? "error" : "status-ok"}>{reviewStateLabel}</p>
      ) : null}

      {executionAuthorized && paid ? (
        <p className="status-nyet">
          Paid Advertising Execution is NOT YET IMPLEMENTED. The organic Facebook adapter
          will not run this package.
        </p>
      ) : null}

      {canExecuteOrganic && !paid ? (
        <div className="actions" style={{ marginTop: "0.75rem" }}>
          <button
            className="primary"
            type="button"
            disabled={busy || executed}
            onClick={() => void post(`/api/dgix/acp/${intakeId}/execute`)}
          >
            {failed ? "Retry Facebook execution" : "Execute on Facebook"}
          </button>
        </div>
      ) : null}
      {executed ? (
        <p className="muted">
          Duplicate publishing is blocked. This ACP already created Facebook object{" "}
          {latestExecution?.externalObjectId || "(id recorded)"}.
        </p>
      ) : null}
      {latestExecution ? (
        <p className="muted">
          Last attempt: {latestExecution.status}
          {latestExecution.operation ? ` · ${latestExecution.operation}` : ""}
          {latestExecution.externalObjectId ? ` · ${latestExecution.externalObjectId}` : ""}
          {latestExecution.completedAt || latestExecution.attemptedAt
            ? ` · ${latestExecution.completedAt || latestExecution.attemptedAt}`
            : ""}
          {latestExecution.sanitizedError ? ` · ${latestExecution.sanitizedError}` : ""}
        </p>
      ) : null}

      {!decided ? (
        <div className="actions" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post(`/api/dgix/acp/${intakeId}/review`, { decision: "reviewed" })
            }
          >
            Mark as reviewed (not approval)
          </button>
        </div>
      ) : null}
    </div>
  );
}
