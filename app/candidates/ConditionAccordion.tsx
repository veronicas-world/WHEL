"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type ConditionPanel = {
  slug: string;
  label: string;
  count: number;
  /** e.g. "3 strong · 14 moderate · 12 emerging" */
  tierSummary: string;
  cards: ReactNode;
};

export default function ConditionAccordion({ items }: { items: ConditionPanel[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(slug: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  // Open (and scroll to) a condition when its anchor is targeted from the
  // summary table at the top of the page.
  useEffect(() => {
    function openFromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      if (!items.some((it) => it.slug === id)) return;
      setOpen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it) => {
        const isOpen = open.has(it.slug);
        return (
          <div
            key={it.slug}
            id={it.slug}
            style={{
              border: "1px solid var(--line)",
              borderLeft: isOpen ? "3px solid var(--moss)" : "1px solid var(--line)",
              backgroundColor: "var(--paper)",
              scrollMarginTop: 24,
              transition: "border-left 0.15s ease",
            }}
          >
            <button
              onClick={() => toggle(it.slug)}
              className="w-full text-left flex items-center justify-between gap-6 p-6 sm:p-8"
              aria-expanded={isOpen}
            >
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-plex-mono, monospace)",
                    fontSize: "10.5px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: isOpen ? "var(--moss)" : "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  {it.count} candidate{it.count === 1 ? "" : "s"} · {it.tierSummary}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-newsreader, Georgia, serif)",
                    fontSize: "clamp(1.3rem, 2vw, 1.6rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.1,
                    margin: 0,
                    color: isOpen ? "var(--moss)" : "var(--ink)",
                  }}
                >
                  {it.label}
                </h3>
              </div>
              <span
                className="shrink-0"
                style={{ color: "var(--moss)", lineHeight: 1, fontSize: "1.4rem", fontWeight: 300 }}
                aria-hidden="true"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="px-6 sm:px-8 pb-8" style={{ borderTop: "1px solid var(--line)" }}>
                <div className="col" style={{ gap: 16, paddingTop: 24 }}>
                  {it.cards}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
