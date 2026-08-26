import Link from "next/link";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function LeadsPage() {
  return (
    <>
      <PlaceholderPanel
        title="Leads"
        laterUse="Connect content and campaigns to conversations, leads, opportunities, clients, and revenue when known. Not a CRM yet."
      />
      <p className="muted" style={{ marginTop: "1rem" }}>
        Leads are not part of this MVP. Return to the <Link href="/">Hub</Link> to
        continue the Goal → Publishing → Intelligence journey.
      </p>
    </>
  );
}
