"use client";

import { useState } from "react";
import Link from "next/link";

interface CardItem {
  label: string;
  desc: string;
}

interface TierItem {
  range: string;
  name: string;
  desc: string;
  bg: string;
  color: string;
  border?: string;
}

interface CarouselCard {
  title: string;
  body: string;
  items?: CardItem[];
  tiers?: TierItem[];
  link?: { text: string; href: string };
}

const CARDS: CarouselCard[] = [
  {
    title: "Model Selection",
    body: "All signal analysis is performed using Claude Opus 4.6, Anthropic's most capable model. Opus was selected specifically for its performance on complex multi-criteria reasoning — simultaneously assessing source quality, replication, biological plausibility, and confounding risk in a single analytical pass. Smaller models were evaluated and produced flatter, less discriminating scores. For a tool where evidence evaluation is the core product, model selection is not a minor implementation detail.",
  },
  {
    title: "Five-Dimension Scoring",
    body: "Every signal is independently scored from 0 to 2 on five dimensions: Replication, Source Quality, Specificity, Biological Plausibility, and Consistency of Direction. Scores are summed for a maximum of 10. A signal scoring 0 on all dimensions fails inclusion and is never entered into the database.",
    items: [
      { label: "Replication", desc: "independent observations across separate sources" },
      { label: "Source Quality", desc: "evidentiary weight of the underlying data" },
      { label: "Specificity", desc: "whether the outcome is clearly defined and clinically relevant" },
      { label: "Biological Plausibility", desc: "strength of the mechanistic rationale" },
      { label: "Consistency of Direction", desc: "whether effect direction is consistent across sources" },
    ],
  },
  {
    title: "Confidence Tiers",
    body: "Total scores map to four confidence tiers displayed on every signal card.",
    tiers: [
      { range: "0–3",  name: "Exploratory", desc: "single-source or mechanistic signals, hypothesis generation only",                         bg: "#F5F3EF", color: "#777",    border: "#C8C3BB" },
      { range: "4–6",  name: "Emerging",    desc: "early-stage evidence with some corroboration",                                              bg: "#EEF1EE", color: "#5C6B5D", border: "#7A8B7A" },
      { range: "7–8",  name: "Moderate",    desc: "replicated findings with solid mechanistic rationale",                                      bg: "#7A8B7A", color: "#fff" },
      { range: "9–10", name: "Strong",      desc: "highly replicated, well-characterized signals across multiple evidence types",              bg: "#5C6B5D", color: "#fff" },
    ],
  },
  {
    title: "Category Minimum Standards",
    body: "Each research arm has its own inclusion floor. Signals that do not meet the minimum are excluded entirely — not entered with a low score.",
    items: [
      { label: "Direct Research",           desc: "requires at least one peer-reviewed human study with clear population, drug, outcome, and effect direction" },
      { label: "Cross-Condition Signals",   desc: "requires the signal in at least two independent evidence domains with a shared mechanism" },
      { label: "Pathway Insights",          desc: "requires a specific named mechanism, at least one drug-target link, and one disease-pathway link" },
      { label: "Community Forum Reports",   desc: "requires 5 or more distinct posts with specific exposure-outcome language from unique users" },
    ],
  },
  {
    title: "Cross-Cutting Reliability Rules",
    body: "Five rules apply to every signal regardless of category.",
    items: [
      { label: "Outcome specificity",      desc: "vague outcomes like \"improved\" do not qualify; pelvic pain, cycle regularity, and mood lability do" },
      { label: "Effect directionality",    desc: "every signal must be classified as improves, worsens, mixed, or unclear" },
      { label: "Replication",              desc: "one source is interesting; two or more independent sources constitute a signal" },
      { label: "Confounding assessment",   desc: "known confounders are flagged, including drugs with multiple indications and forum populations on concurrent therapies" },
      { label: "Denominator awareness",    desc: "FDA AEMS and community data are signal-generating, not causal; signals from these sources require corroboration before elevation above Emerging" },
    ],
  },
  {
    title: "One Guiding Principle",
    body: "Frequency is not truth. A rare but repeatedly observed, highly specific signal from a single credible source may carry more evidential weight than 500 vague forum mentions. WHEL's scoring framework privileges specificity, reproducibility, and triangulation over raw volume.",
    link: { text: "Read the full methodology", href: "/about/technical-architecture" },
  },
];

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous card" : "Next card"}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid",
        borderColor: disabled ? "#D6D1C9" : "#4D5E4D",
        backgroundColor: "#fff",
        color: disabled ? "#C8C3BB" : "#4D5E4D",
        cursor: disabled ? "default" : "pointer",
        transition: "opacity 0.15s",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

function CardContent({ card }: { card: CarouselCard }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E0DDD8",
        padding: "2.5rem",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <h3
        className="font-heading"
        style={{ fontSize: "1.375rem", fontWeight: 500, color: "#1a1a1a", lineHeight: 1.3 }}
      >
        {card.title}
      </h3>

      <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#333" }}>
        {card.body}
      </p>

      {/* Tier rows */}
      {card.tiers && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "0.25rem" }}>
          {card.tiers.map((tier) => (
            <div
              key={tier.name}
              style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  padding: "2px 8px",
                  backgroundColor: tier.bg,
                  color: tier.color,
                  border: tier.border ? `1px solid ${tier.border}` : undefined,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tier.range}: {tier.name.toUpperCase()}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.5 }}>
                {tier.desc}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Item list */}
      {card.items && (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
            marginTop: "0.25rem",
            paddingLeft: 0,
            listStyle: "none",
          }}
        >
          {card.items.map((item) => (
            <li
              key={item.label}
              style={{
                display: "flex",
                gap: "0.5rem",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "#333",
                paddingLeft: "0.875rem",
                borderLeft: "2px solid #E0DDD8",
              }}
            >
              <span>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{item.label}</span>
                {" — "}
                {item.desc}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Link (Card 6) */}
      {card.link && (
        <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
          <Link
            href={card.link.href}
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#4D5E4D",
              textDecoration: "none",
              borderBottom: "1px solid #4D5E4D",
              paddingBottom: "1px",
            }}
          >
            {card.link.text} →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function EvidenceCarousel() {
  const [current, setCurrent] = useState(0);
  const total = CARDS.length;

  return (
    <section style={{ backgroundColor: "#F5F3EF", borderBottom: "1px solid #E0DDD8" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {/* Section heading */}
        <div className="mb-10">
          <h2
            className="font-heading text-2xl sm:text-3xl mb-2"
            style={{ color: "#1a1a1a" }}
          >
            How evidence is evaluated
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.6 }}>
            Every signal in WHEL is scored before it enters the database.
          </p>
        </div>

        {/* Carousel */}
        <div className="flex flex-col">

          {/* Card + desktop side arrows */}
          <div className="flex items-center gap-4">
            {/* Left arrow: desktop only */}
            <div className="hidden md:block">
              <ArrowButton
                direction="left"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
              />
            </div>

            {/* Viewport: full width on mobile, flex-1 on desktop */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                style={{
                  display: "flex",
                  transform: `translateX(-${current * 100}%)`,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {CARDS.map((card, i) => (
                  <div key={i} style={{ flex: "0 0 100%", minWidth: 0 }}>
                    <CardContent card={card} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right arrow: desktop only */}
            <div className="hidden md:block">
              <ArrowButton
                direction="right"
                onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                disabled={current === total - 1}
              />
            </div>
          </div>

          {/* Mobile arrows: centered below card, hidden on desktop */}
          <div className="flex md:hidden items-center justify-center gap-6 mt-4">
            <ArrowButton
              direction="left"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            />
            <ArrowButton
              direction="right"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
            />
          </div>

        </div>

        {/* Counter + dot indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            marginTop: "1.25rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#777",
            }}
          >
            {current + 1} / {total}
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to card ${i + 1}`}
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  padding: 0,
                  border: "none",
                  backgroundColor: i === current ? "#4D5E4D" : "#C8C3BB",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
