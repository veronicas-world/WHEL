"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string };

/**
 * Floating side table-of-contents shared by the long document pages (condition
 * pages and the per-candidate signal breakdown). It reuses the global `.doc-toc`
 * rail (fixed, wide-screens-only) but adds two behaviours the static roadmap
 * rail lacks, because these pages open on a full-bleed DARK hero band and then
 * scroll into light bands:
 *
 *   1. Colour flip — while the rail overlaps the dark hero it switches to the
 *      on-ink (light) palette so the links stay legible; once the hero scrolls
 *      past, it returns to the default ink palette over the light bands.
 *   2. Active highlight — the entry for the section currently at the top of the
 *      viewport is emphasised.
 *
 * Everything runs in a passive scroll handler; there is no layout work on the
 * server, so the rail is purely additive and degrades to nothing below 1160px
 * (the `.doc-toc` media query hides it).
 */
export default function SideToc({
  items,
  heroId = "overview",
}: {
  items: TocItem[];
  heroId?: string;
}) {
  const [onDark, setOnDark] = useState(true);
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    // Probe roughly at the rail's vertical centre (it is fixed at top:116px and
    // a few rows tall). If the dark hero still reaches past this line, the rail
    // is sitting on dark and needs the light palette.
    const PROBE_Y = 210;
    const ACTIVE_LINE = 140;

    const update = () => {
      const hero = document.getElementById(heroId);
      if (hero) setOnDark(hero.getBoundingClientRect().bottom > PROBE_Y);

      let current = items[0]?.id ?? "";
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_LINE) current = it.id;
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items, heroId]);

  return (
    <aside
      className={`doc-toc side-toc${onDark ? " side-toc--ondark" : ""}`}
      aria-label="On this page"
    >
      <div className="doc-toc-eyebrow">On this page</div>
      {items.map((it, i) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className={active === it.id ? "is-active" : undefined}
        >
          <span className="doc-n">{String(i + 1).padStart(2, "0")}</span>
          <span className="doc-t">{it.label}</span>
        </a>
      ))}
    </aside>
  );
}
