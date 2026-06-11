"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function WhelMark({ size = 30 }: { size?: number }) {
  const off = 17, r = 21, sw = 4.6;
  const centers: [number, number][] = [
    [50, 50 - off],
    [50 + off, 50],
    [50, 50 + off],
    [50 - off, 50],
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
          stroke={i === 0 ? "var(--signal)" : "var(--bone)"}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Platform",   href: "/platform" },
  { label: "Candidates", href: "/candidates" },
  { label: "Conditions", href: "/conditions" },
  { label: "Methods",    href: "/about/technical-architecture", hideSm: true },
  { label: "About",      href: "/about" },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
        <nav className="hidden sm:flex" style={{ gap: 26, alignItems: "center", marginLeft: "auto" }}>
          {NAV_LINKS.map(({ label, href, hideSm }) => (
            <Link
              key={href}
              href={href}
              className={`${hideSm ? "hide-sm" : ""} ${isActive(href) ? "active" : ""}`}
              style={{
                fontFamily: "var(--font-plex-mono, monospace)",
                fontSize: "11.5px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                padding: "8px 0",
                position: "relative",
                transition: "color 140ms",
                textDecoration: "none",
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
          <Link
            href="/about/contact"
            className="nav-cta"
            style={{ textDecoration: "none" }}
          >
            Request access
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          style={{ background: "none", border: "none" }}
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
          <nav className="flex flex-col px-6 py-4 gap-1">
            {[...NAV_LINKS, { label: "Request access", href: "/about/contact" }].map(
              ({ label, href }, i, arr) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 0",
                    fontFamily: "var(--font-plex-mono, monospace)",
                    fontSize: "11.5px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActive(href) ? "var(--on-ink)" : "var(--on-ink-2)",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--ink-line-2)" : "none",
                    textDecoration: "none",
                  }}
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
