import Link from "next/link";
import LinkedInIcon from "./LinkedInIcon";

const LINKEDIN_URL = "https://www.linkedin.com/company/whel2026/";

const EXPLORE_LINKS = [
  { label: "Conditions", href: "/conditions" },
  { label: "Search", href: "/search" },
  { label: "Signal Types", href: "/signal-types" },
  { label: "Technical Architecture", href: "/about/technical-architecture" },
  { label: "Validation", href: "/about/methodology" },
  { label: "Changelog", href: "/about/methodology/changelog" },
];

const ABOUT_LINKS = [
  { label: "Mission", href: "/about" },
  { label: "Roadmap", href: "/about/roadmap" },
  { label: "External References", href: "/about/external-references" },
  { label: "Contact", href: "/about/contact" },
];

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--bg-2)", borderTop: "1px solid var(--rule)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div className="sm:col-span-1">
            <p
              className="font-serif"
              style={{ fontSize: "1.35rem", fontWeight: 600, color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.01em" }}
            >
              Whel
            </p>
            <p
              style={{
                ...MONO,
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 14,
              }}
            >
              Women&apos;s Health Evidence Lab
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "28ch" }}>
              An evidence index for under-studied women&apos;s health conditions.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Whel on LinkedIn"
              className="transition-opacity hover:opacity-60"
              style={{
                ...MONO,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 16,
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
                textDecoration: "none",
              }}
            >
              <LinkedInIcon size={14} />
              LinkedIn
            </a>
          </div>

          {/* Explore */}
          <div>
            <p
              style={{
                ...MONO,
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              Explore
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EXPLORE_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm transition-opacity hover:opacity-60"
                  style={{ color: "var(--ink-2)", textDecoration: "none" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <p
              style={{
                ...MONO,
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              About
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ABOUT_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm transition-opacity hover:opacity-60"
                  style={{ color: "var(--ink-2)", textDecoration: "none" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--rule)",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 24px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ ...MONO, fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>
            &copy; {new Date().getFullYear()} Women&apos;s Health Evidence Lab
          </span>
          <span style={{ ...MONO, fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>
            For research and educational purposes only
          </span>
          <span style={{ ...MONO, fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>
            Correspondence:{" "}
            <a
              href="mailto:vla2117@columbia.edu"
              style={{ color: "var(--ink-2)", borderBottom: "1px solid var(--rule)" }}
            >
              vla2117@columbia.edu
            </a>
          </span>
        </div>

      </div>
    </footer>
  );
}
