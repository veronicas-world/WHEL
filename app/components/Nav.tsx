"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";

/** WHEL mark — four overlapping rings, one for each of the four research arms. */
function WhelMark() {
  const rings = [
    { cx: 16, cy: 9.5 },  // top
    { cx: 22.5, cy: 16 }, // right
    { cx: 16, cy: 22.5 }, // bottom
    { cx: 9.5, cy: 16 },  // left
  ];
  return (
    <svg
      viewBox="0 0 32 32"
      width="26"
      height="26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {rings.map((r, i) => (
        <circle
          key={i}
          cx={r.cx}
          cy={r.cy}
          r="8.3"
          stroke="var(--green-deep)"
          strokeWidth="1.7"
        />
      ))}
    </svg>
  );
}

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Conditions", href: "/conditions" },
];

const METHODOLOGY_LINKS: NavLink[] = [
  { label: "Signal Types", href: "/signal-types" },
  { label: "Technical Architecture", href: "/about/technical-architecture" },
  { label: "Validation", href: "/about/methodology" },
  { label: "Changelog", href: "/about/methodology/changelog" },
];

const ABOUT_LINKS: NavLink[] = [
  { label: "Mission", href: "/about" },
  { label: "Roadmap", href: "/about/roadmap" },
  { label: "External References", href: "/about/external-references" },
  { label: "Contact", href: "/about/contact" },
];

/** Hover/click dropdown used for the Methodology and About menus. */
function NavDropdown({ label, links }: { label: string; links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        className="text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-60"
        style={{ color: "var(--ink)" }}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        {label}
      </button>

      {open && (
        <div className="absolute top-full right-0 pt-2" style={{ zIndex: 50, minWidth: "210px" }}>
          <div
            style={{
              backgroundColor: "var(--paper)",
              border: "1px solid var(--ink)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            {links.map(({ label: itemLabel, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm transition-colors"
                style={{ color: "var(--ink)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {itemLabel}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: "var(--paper)",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14 sm:h-16">

        {/* Logo / wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          style={{ textDecoration: "none", color: "var(--ink)" }}
          onClick={() => setMobileOpen(false)}
        >
          <WhelMark />
          <span
            className="font-serif"
            style={{
              fontWeight: 600,
              fontSize: "1.15rem",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "var(--ink)",
            }}
          >
            Whel
          </span>
          <span
            className="hidden lg:inline font-mono"
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--muted)",
              borderLeft: "1px solid var(--rule)",
              paddingLeft: 12,
              marginLeft: 2,
              lineHeight: 1.2,
            }}
          >
            Women&apos;s Health Evidence Lab
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6 flex-1 justify-end">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-60"
              style={{ color: "var(--ink)" }}
            >
              {label}
            </Link>
          ))}

          <NavDropdown label="Methodology" links={METHODOLOGY_LINKS} />
          <NavDropdown label="About" links={ABOUT_LINKS} />

          {/* Search bar */}
          <div className="w-52 lg:w-64">
            <SearchBar size="sm" />
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className="block w-5 h-px transition-all duration-200"
            style={{
              background: "var(--ink)",
              transform: mobileOpen ? "translateY(5px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-5 h-px transition-all duration-200"
            style={{ background: "var(--ink)", opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px transition-all duration-200"
            style={{
              background: "var(--ink)",
              transform: mobileOpen ? "translateY(-5px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="sm:hidden"
          style={{
            backgroundColor: "var(--paper)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div className="px-4 pt-4 pb-3">
            <SearchBar size="lg" onNavigate={() => setMobileOpen(false)} />
          </div>
          <nav className="flex flex-col px-4 pb-4 gap-1">
            {[...NAV_LINKS, ...METHODOLOGY_LINKS, ...ABOUT_LINKS].map(({ label, href }, i, arr) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-3 text-sm font-medium"
                style={{
                  color: "var(--ink)",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
