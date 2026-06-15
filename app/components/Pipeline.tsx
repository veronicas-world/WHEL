const STAGES = [
  { k: "Signal",    t: "Off-label & patient signal",        d: "Prescribing patterns, community reports, under-read literature." },
  { k: "Ground",    t: "Ontology grounding",                d: "Entities resolved to MONDO, EFO, RxNorm, ChEMBL." },
  { k: "Validate",  t: "Mechanistic & clinical check",      d: "Per-claim provenance; synthesis marked; contradictions surfaced." },
  { k: "Tier",      t: "Confidence tiering",                d: "Graded from strong to exploratory, never flattened into one weight." },
  { k: "Candidate", t: "505(b)(2)-eligible candidate",      d: "Which drug, which condition, with its full evidence trail." },
];

export default function Pipeline() {
  return (
    <div className="pipeline-grid" style={{
      display: "grid",
      gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
      gap: 1,
      background: "var(--ink-line-2)",
      border: "1px solid var(--ink-line-2)",
    }}>
      {STAGES.map((s, i) => (
        <div key={s.k} style={{
          background: "var(--ink)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 200,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11,
              color: "var(--signal)", letterSpacing: "0.1em",
            }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {i < STAGES.length - 1 && (
              <span style={{ fontFamily: "var(--font-plex-mono, monospace)", color: "var(--on-ink-mut)" }}>→</span>
            )}
          </div>
          <div style={{
            fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10,
            letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--on-ink-mut)",
          }}>{s.k}</div>
          <div style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 18, color: "var(--on-ink)", lineHeight: 1.2 }}>{s.t}</div>
          <div style={{ fontSize: 13, color: "var(--on-ink-2)", lineHeight: 1.5 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}
