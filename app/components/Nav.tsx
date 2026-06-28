"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function WhelMark({ size = 30 }: { size?: number }) {
  const r = 21, sw = 4.6;
  // Three circles in a symmetric trefoil: one pointing up, the other two
  // 120° apart, all offset 17 from the center (50, 50).
  const centers: [number, number][] = [
    [50, 33],
    [64.7, 58.5],
    [35.3, 58.5],
  ];
  return (
    <svg
      className="mk-glyph"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Whel"
      style={{ overflow: "visible" }}
    >
      {centers.map((c, i) => (
        <circle
          key={i}
          cx={c[0]}
          cy={c[1]}
          r={r}
          fill="none"
          stroke="var(--bone)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

const NAV_LINKS: { label: string; href: string; hideSm?: boolean }[] = [
  { label: "Manifesto",  href: "/manifesto" },
  { label: "Platform",   href: "/platform" },
  { label: "Conditions", href: "/conditions" },
];

// The About dropdown is split into two labelled groups: the company story,
// and the deeper "how it works" methodology / references pages, so a reader
// vetting Whel sees the cluster as a cluster.
const ABOUT_GROUPS: { label: string; items: { label: string; href: string }[] }[] = [
  {
    label: "Company",
    items: [
      { label: "About",   href: "/about" },
      { label: "Roadmap", href: "/about/roadmap" },
      { label: "Contact", href: "/about/contact" },
    ],
  },
  {
    label: "How it works",
    items: [
      { label: "Technical architecture", href: "/about/technical-architecture" },
      { label: "Signal types",           href: "/signal-types" },
      { label: "External references",    href: "/about/external-references" },
    ],
  },
];

const LINK_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, monospace)",
  fontSize: "11.5px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "8px 0",
  textDecoration: "none",
  transition: "color 140ms",
};

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const aboutActive = pathname.startsWith("/about") || pathname === "/signal-types";

  return (
    <header className="whel-nav">
      <div className="container whel-nav-inner">

        {/* Wordmark */}
        <Link
          href="/"
          className="wordmark"
          style={{ textDecoration: "none", color: "var(--on-ink)" }}
          onClick={() => setMobileOpen(false)}
        >
          <WhelMark size={30} />
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span className="mk-name" style={{ color: "var(--on-ink)" }}>Whel</span>
            <span className="mk-sub">Women&apos;s Health Evidence Lab</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex primary-nav" style={{ gap: 26, alignItems: "center", marginLeft: "auto" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "active" : ""}
              style={{
                ...LINK_STYLE,
                color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                position: "relative",
              }}
            >
              {label}
              {isActive(href) && (
                <span style={{
                  position: "absolute", left: 0, right: 0, bottom: 0,
                  height: "1.5px", background: "var(--signal)",
                }} />
              )}
            </Link>
          ))}

          {/* About dropdown */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={aboutOpen}
              onClick={() => setAboutOpen((v) => !v)}
              style={{
                ...LINK_STYLE,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: aboutActive ? "var(--on-ink)" : "var(--on-ink-2)",
                position: "relative",
              }}
            >
              About
              <span aria-hidden="true" style={{ fontSize: 8, transform: aboutOpen ? "rotate(180deg)" : "none", transition: "transform 140ms" }}>▼</span>
              {aboutActive && (
                <span style={{ position: "absolute", left: 0, right: 14, bottom: 0, height: "1.5px", background: "var(--signal)" }} />
              )}
            </button>

            {aboutOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  minWidth: 244,
                  backgroundColor: "rgba(26,29,20,0.98)",
                  border: "1px solid var(--ink-line-2)",
                  padding: "4px 0",
                  zIndex: 60,
                }}
              >
                {ABOUT_GROUPS.map((group, gi) => (
                  <div
                    key={group.label}
                    style={{
                      padding: "8px 0",
                      borderTop: gi > 0 ? "1px solid var(--ink-line-2)" : "none",
                    }}
                  >
                    <div
                      style={{
                        padding: "2px 18px 6px",
                        fontFamily: "var(--font-plex-mono, monospace)",
                        fontSize: "9.5px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--on-ink-mut)",
                      }}
                    >
                      {group.label}
                    </div>
                    {group.items.map(({ label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={() => setAboutOpen(false)}
                        style={{
                          display: "block",
                          padding: "9px 18px",
                          fontFamily: "var(--font-plex-mono, monospace)",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/candidates"
            className="nav-cta"
            style={{ textDecoration: "none" }}
          >
            View candidates
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          style={{ background: "none", border: "none", marginLeft: "auto" }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-5 h-px transition-all duration-200"
              style={{
                background: "var(--on-ink)",
                transform: mobileOpen
                  ? i === 0 ? "translateY(5px) rotate(45deg)"
                  : i === 2 ? "translateY(-5px) rotate(-45deg)"
                  : "none"
                  : "none",
                opacity: mobileOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="sm:hidden"
          style={{
            backgroundColor: "rgba(26,29,20,0.96)",
            borderTop: "1px solid var(--ink-line-2)",
          }}
        >
          <nav className="flex flex-col px-6 py-4">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "14px 0",
                  fontFamily: "var(--font-plex-mono, monospace)",
                  fontSize: "11.5px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                  borderBottom: "1px solid var(--ink-line-2)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}

            {/* About groups */}
            {ABOUT_GROUPS.map((group) => (
              <div key={group.label}>
                <span style={{
                  display: "block",
                  padding: "16px 0 8px",
                  fontFamily: "var(--font-plex-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--on-ink-mut, rgba(244,239,230,0.5))",
                }}>
                  {group.label}
                </span>
                {group.items.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 0 12px 14px",
                      fontFamily: "var(--font-plex-mono, monospace)",
                      fontSize: "11.5px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                      borderBottom: "1px solid var(--ink-line-2)",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ))}

            <Link
              href="/candidates"
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "14px 0",
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: "11.5px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--on-ink)",
                textDecoration: "none",
              }}
            >
              View candidates
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
