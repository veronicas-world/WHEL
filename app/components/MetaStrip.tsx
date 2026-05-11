// Operational status bar — shown at the top of the home page.
// Dark bar with green live indicator and dot-separated segments.
//
// Ingestion state is driven by NEXT_PUBLIC_INGESTION_STATUS:
//   "active"  → "Ingestion active"
//   "paused"  → "Ingestion paused for review"   (default)
//   "between" → "Next review pending"
//
// Release tag comes from NEXT_PUBLIC_RELEASE_TAG, falling back to "2026.04".

type MetaStripProps = {
  signals?: number;
  conditions?: number;
  arms?: number;
};

function ingestionLabel(): string {
  const raw = (process.env.NEXT_PUBLIC_INGESTION_STATUS ?? "paused").toLowerCase();
  if (raw === "active")  return "Ingestion active";
  if (raw === "between") return "Next review pending";
  return "Ingestion paused for review";
}

export default function MetaStrip({ signals, conditions, arms = 4 }: MetaStripProps) {
  const release = process.env.NEXT_PUBLIC_RELEASE_TAG ?? "2026.04";

  const segments: string[] = [
    ingestionLabel(),
    `Release ${release}`,
    ...(typeof signals === "number" && typeof conditions === "number"
      ? [`${signals} signals across ${conditions} conditions`]
      : []),
    `${arms} evidence arms`,
    "Reviewed quarterly",
  ];

  return (
    <div style={{ background: "var(--ink)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "9px 0",
          fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
          fontSize: "10.5px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          gap: 0,
        }}
      >
        {/* LIVE indicator */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <span
            aria-label="Live"
            style={{
              width: 6,
              height: 6,
              background: "#6BCB77",
              borderRadius: "50%",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Live
        </span>

        {segments.map((seg) => (
          <span
            key={seg}
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "rgba(255,255,255,0.5)",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 14px" }}>·</span>
            {seg}
          </span>
        ))}
      </div>
    </div>
  );
}
