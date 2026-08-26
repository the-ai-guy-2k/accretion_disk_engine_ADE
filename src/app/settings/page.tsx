import Link from "next/link";
import { FoundationStatus } from "@/components/FoundationStatus";

const ENV_NAMES = [
  "ADE_PORT",
  "ADE_APP_URL",
  "ADE_SQLITE_PATH",
  "ADE_AI_PROVIDER",
  "ADE_AI_API_KEY",
  "ADE_AI_MODEL",
  "ADE_AI_BASE_URL",
  "ADE_AI_TIMEOUT_MS",
  "META_GRAPH_API_VERSION",
  "ADE_DGIX_FB_CLIENT_ID",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_ID",
  "ADE_DGIX_FB_PAGE_ID",
  "ADE_DGIX_FB_PAGE_ACCESS_TOKEN",
  "META_AD_ACCOUNT_ID",
  "META_AD_ACCESS_TOKEN"
];

export default function SettingsPage() {
  return (
    <section>
      <h1>Settings</h1>
      <p className="lede">
        Configuration names for the local MVP. Secret values are not displayed
        and must not be committed. Copy <code>.env.example</code> to{" "}
        <code>.env.local</code> when values are needed.
      </p>
      <FoundationStatus />
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Environment variable names</h2>
        <p className="muted">
          Live AI content generation and live AI performance analysis both use{" "}
          <code>ADE_AI_API_KEY</code> (or <code>OPENAI_API_KEY</code> for the OpenAI
          provider). Secret values are not displayed. Deterministic analytics remain
          available if live AI is not configured. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code> and restart ADE after changing credentials.
        </p>
        <ul>
          {ENV_NAMES.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Meta / Facebook variables configure the DGIX Facebook connection
          (logical client, Page identity, optional Ad Account). Secret values are
          not displayed. Connection validation may call Meta to confirm identity.
          Real Facebook publishing and paid advertising execution remain not
          implemented. Open the <Link href="/dgix">DGIX workspace</Link> to see
          connection status.
        </p>
        <p>
          <Link href="/leads">Leads placeholder</Link>
          {" · "}
          <Link href="/">Back to Hub</Link>
        </p>
      </div>
    </section>
  );
}
