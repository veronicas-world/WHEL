"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".scroll-section"),
    );
    if (!sections.length) return;

    // Mark dark-surface sections so CSS can pick the right veil color
    sections.forEach(s => {
      const dark =
        s.classList.contains("surface-ink") || s.classList.contains("surface-moss");
      s.dataset.scrollDark = dark ? "1" : "0";
    });

    // Sections already in viewport on mount skip the entrance animation
    sections.forEach(s => {
      const { top, bottom } = s.getBoundingClientRect();
      if (top < window.innerHeight * 0.92 && bottom > 0) {
        s.classList.add("s-in");
      }
    });

    // Activate CSS now that initial state is set (prevents FOUC)
    document.body.classList.add("scroll-effects-ready");

    // Entrance: reveal sections as they scroll into view (one-shot)
    const enterObs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("s-in");
            enterObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.04 },
    );
    sections.forEach(s => {
      if (!s.classList.contains("s-in")) enterObs.observe(s);
    });

    // Active section: whichever section's center is closest to viewport midpoint
    let rafId = 0;
    function updateActive() {
      const mid = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        const dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = s; }
      });
      sections.forEach(s => s.classList.toggle("s-focus", s === best));
    }

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActive);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    updateActive(); // set initial focus without waiting for a scroll event

    return () => {
      enterObs.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      document.body.classList.remove("scroll-effects-ready");
    };
  }, []);

  return null;
}
