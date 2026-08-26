"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcpReviewActions({ intakeId }: { intakeId: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: "reviewed" | "declined") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dgix/acp/${intakeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
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
      <div className="actions">
        <button className="primary" type="button" disabled={busy} onClick={() => void decide("reviewed")}>
          Mark as reviewed (not approval)
        </button>
        <button type="button" disabled={busy} onClick={() => void decide("declined")}>
          Decline package
        </button>
      </div>
    </div>
  );
}
