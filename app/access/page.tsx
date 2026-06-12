import type { Metadata } from "next";
import Link from "next/link";
import RequestAccessForm from "./RequestAccessForm";

export const metadata: Metadata = {
  title: "Request access",
  description: "Request access to the full Whel candidate index and evidence substrate — a research preview for clinician-researchers, pharma R&D teams, and advocacy organizations.",
};

export default function AccessPage() {
  return (
    <main>
      {/* Header */}
      <section className="surface-ink" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Request access</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>Research preview · invite-only</div>
          <h1 className="display" style={{ color: "var(--on-ink)", fontSize: "clamp(40px,5vw,76px)", maxWidth: "16ch" }}>
            Request access.
          </h1>
          <p className="lede" style={{ marginTop: 26, color: "var(--on-ink-2)", maxWidth: "60ch" }}>
            The public site shows the story and a sample of the evidence. The full index &mdash; every candidate
            across all six conditions with its complete trail, the searchable substrate, and data export &mdash; is
            open by invitation during the research preview. Tell us who you are and we&rsquo;ll be in touch.
          </p>
        </div>
      </section>

      {/* Form + who it's for */}
      <section className="surface-bone section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "start" }}
            className="access-grid">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>The request</div>
              <RequestAccessForm />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Who it&rsquo;s for</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--body)", maxWidth: "44ch" }}>
                Whel is a research-support tool for clinician-researchers and pharma women&rsquo;s-health R&amp;D
                teams &mdash; not a clinical decision engine and not a consumer product. Access during the preview is
                granted to:
              </p>
              <ul style={{ marginTop: 14, paddingLeft: 18, color: "var(--body)", fontSize: 15, lineHeight: 1.8 }}>
                <li>Clinician-researchers and women&rsquo;s-health clinicians</li>
                <li>Pharma &amp; biotech R&amp;D teams (data / API / partnership)</li>
                <li>Academic and research institutions</li>
                <li>Advocacy organizations</li>
              </ul>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", marginTop: 18, maxWidth: "44ch" }}>
                Prefer email? Write to <a href="mailto:vla2117@columbia.edu" style={{ color: "var(--moss)" }}>vla2117@columbia.edu</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
