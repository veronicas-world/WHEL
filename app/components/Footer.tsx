import Link from "next/link";

function WhelMark({ size = 28 }: { size?: number }) {
  const off = 17, r = 21, sw = 4.6;
  const centers: [number, number][] = [
    [50, 50 - off], [50 + off, 50], [50, 50 + off], [50 - off, 50],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ overflow: "visible" }}>
      {centers.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={r} fill="none"
          stroke={i === 0 ? "var(--signal)" : "var(--bone)"}
          strokeWidth={sw} strokeLinecap="round" />
      ))}
    </svg>
  );
}

const PLATFORM_LINKS = [
  { label: "Manifesto",  href: "/manifesto" },
  { label: "Platform",   href: "/platform" },
  { label: "Conditions", href: "/conditions" },
  { label: "Candidates", href: "/candidates" },
];

const COMPANY_LINKS = [
  { label: "About",          href: "/about" },
  { label: "Roadmap",        href: "/about/roadmap" },
  { label: "News",           href: "/news" },
  { label: "Contact",        href: "/about/contact" },
  { label: "Request access", href: "/access" },
];

export default function Footer() {
  return (
    <footer className="whel-footer">
      <div className="container">
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 44 }}>

          {/* Brand */}
          <div>
            <span className="wordmark" style={{ color: "var(--on-ink)" }}>
              <WhelMark size={28} />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                  fontFamily: "var(--font-newsreader, Georgia, serif)", fontWeight: 500,
                  fontSize: 22, letterSpacing: "-0.015em", lineHeight: 1, color: "var(--on-ink)",
                }}>Whel</span>
                <span style={{
                  fontFamily: "var(--font-plex-mono, monospace)", fontSize: 8,
                  letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4,
                  opacity: 0.6, color: "var(--on-ink)",
                }}>Women&apos;s Health Evidence Lab</span>
              </span>
            </span>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--on-ink-2)", maxWidth: "38ch", marginTop: 20 }}>
              The drug repurposing platform for female biology. We surface the approved drugs that
              already work for women&apos;s health conditions and prove it rigorously enough to act on.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 20 }}>
              <span className="live">
                <span className="ldot" />
                Reviewed quarterly · v0.1
              </span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4>Platform</h4>
            {PLATFORM_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="fl">{label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4>Company</h4>
            {COMPANY_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="fl">{label}</Link>
            ))}
          </div>

          {/* Notice */}
          <div>
            <h4>Notice</h4>
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: "var(--on-ink-mut)",
              fontFamily: "var(--font-plex-mono, monospace)", letterSpacing: "0.01em",
            }}>
              A research-support tool under the 21st Century Cures Act §3060 exemption, rather
              than a clinical recommendation engine. Every result links to its source and its
              date so that it can be checked.
            </p>
            <div style={{ marginTop: 16 }}>
              <a
                href="mailto:vla2117@columbia.edu"
                style={{
                  fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "var(--on-ink-2)", textDecoration: "none",
                  borderBottom: "1px solid var(--ink-line)",
                }}
              >
                vla2117@columbia.edu
              </a>
            </div>
          </div>

        </div>

        <div className="legal">
          <span>Whel, Inc., a Delaware C-Corporation founded in 2026</span>
          <span>Women&apos;s Health Evidence Lab · whel.bio</span>
        </div>
      </div>
    </footer>
  );
}
