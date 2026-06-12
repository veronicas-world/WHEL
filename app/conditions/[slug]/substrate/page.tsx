import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ── types ─────────────────────────────────────────────────────────── */
type Claim = {
  id: string;
  text: string;
  exact_quote: string;
  quote_start_char: number | null;
  quote_end_char: number | null;
  intervention_id: string | null;
  condition_id: string | null;
  outcome: string | null;
  aspect: string | null;
  direction: string | null;
  provenance_verified: boolean;
  entailment_label: string | null;
  entailment_score: number | null;
  document_id: string;
};
type Contradiction = {
  id: string;
  claim_a_id: string;
  claim_b_id: string;
  intervention_id: string | null;
  nli_score: number | null;
  rationale: string | null;
};
type Doc = {
  id: string;
  external_id: string | null;
  url: string | null;
  title: string | null;
  meta: { journal?: string; year?: string } | null;
  source_status: string | null;
};
type Ground = { id: string; source: string | null };

/* Registry link for a grounded entity (RxNorm drug / MONDO condition). */
function registryHref(ontologyId: string): string {
  if (ontologyId.startsWith("MONDO"))
    return `https://www.ebi.ac.uk/ols4/ontologies/mondo/classes?obo_id=${encodeURIComponent(ontologyId)}`;
  const cui = ontologyId.split(":")[1] ?? "";
  return `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${cui}`;
}
function RegistryPill({ g }: { g?: Ground }) {
  if (!g?.id) return null;
  return (
    <a href={registryHref(g.id)} target="_blank" rel="noopener noreferrer"
      style={{ fontFamily: "var(--font-plex-mono, monospace)", fontSize: 10, letterSpacing: "0.04em",
        color: "var(--moss)", background: "var(--supports-bg, #E7ECDD)", border: "1px solid var(--moss)",
        padding: "1px 7px", borderRadius: 999, textDecoration: "none", marginLeft: 8, whiteSpace: "nowrap" }}>
      {g.id}
    </a>
  );
}

/* Substrate is seeded for PMDD/PMS first. Other slugs render an honest empty state. */
const COND_LABELS: Record<string, string[]> = { pmdd: ["PMDD", "PMS"] };

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, monospace)",
};

/* Direction / entailment badge colors, drawn from the site palette (globals.css). */
const DIR: Record<string, { fg: string; bg: string; label: string }> = {
  positive: { fg: "#2E3D2B", bg: "#DFE2CC", label: "supports" },
  null:     { fg: "#6B5B3E", bg: "#E8DDBF", label: "no benefit" },
  negative: { fg: "#8C4A2E", bg: "#F0DCD0", label: "worse / harmful" },
  unclear:  { fg: "#5C6151", bg: "#E3DDD0", label: "unclear" },
};
const ENT: Record<string, { fg: string; bg: string }> = {
  entailed:     { fg: "#2E3D2B", bg: "#DFE2CC" },
  neutral:      { fg: "#6B5B3E", bg: "#E8DDBF" },
  contradicted: { fg: "#8C4A2E", bg: "#F0DCD0" },
  pending:      { fg: "#5C6151", bg: "#E3DDD0" },
};

function Badge({ fg, bg, children }: { fg: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase",
      color: fg, background: bg, padding: "2px 8px", borderRadius: 3, whiteSpace: "nowrap",
      marginRight: 6, display: "inline-block" }}>
      {children}
    </span>
  );
}

async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase.from("conditions").select("name").eq("slug", slug).single();
  return { title: data?.name ? `${data.name} substrate | Whel` : "Substrate | Whel" };
}
export { generateMetadata };

/* ── claim card ────────────────────────────────────────────────────── */
function ClaimCard({ claim, docs, showIntervention, interventionLabel }: {
  claim: Claim; docs: Map<string, Doc>; showIntervention?: boolean; interventionLabel?: string;
}) {
  const doc = docs.get(claim.document_id);
  const d = DIR[claim.direction ?? "unclear"] ?? DIR.unclear;
  const e = ENT[claim.entailment_label ?? "pending"] ?? ENT.pending;
  const ent = claim.entailment_label ?? "pending";
  const escore = claim.entailment_score != null ? ` ${Number(claim.entailment_score).toFixed(2)}` : "";
  const offsets = claim.quote_start_char != null
    ? `chars ${claim.quote_start_char}\u2013${claim.quote_end_char}` : "offset n/a";
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--rule)",
      borderLeft: "3px solid var(--moss)", borderRadius: 6, padding: "12px 14px", margin: "10px 0" }}>
      <div style={{ marginBottom: 6 }}>
        {showIntervention && interventionLabel && (
          <Badge fg="#FBF8F1" bg="var(--moss)">{interventionLabel}</Badge>
        )}
        <Badge fg={d.fg} bg={d.bg}>{claim.direction} · {d.label}</Badge>
        {claim.aspect && <Badge fg="#5C6151" bg="var(--bg-3)">{claim.aspect}</Badge>}
        <Badge fg={e.fg} bg={e.bg}>entailment: {ent}{escore}</Badge>
        <Badge fg="var(--moss)" bg="var(--supports-bg, #E7ECDD)">provenance: {claim.provenance_verified ? "verified" : "unverified"}</Badge>
      </div>
      <p style={{ fontSize: "0.95rem", lineHeight: 1.55, color: "var(--ink)", margin: "4px 0 8px" }}>
        {claim.text}
      </p>
      <div style={{ background: "var(--bg-2)", border: "1px dashed var(--rule-strong)",
        borderRadius: 5, padding: "8px 10px" }}>
        <p style={{ fontStyle: "italic", color: "var(--ink-2)", fontSize: "0.9rem", margin: 0 }}>
          &ldquo;{claim.exact_quote}&rdquo;
        </p>
        <p style={{ ...MONO, fontSize: 11, color: "var(--muted)", marginTop: 6, marginBottom: 0 }}>
          {doc?.url ? (
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--moss)" }}>{doc.title}</a>
          ) : <span>{doc?.title}</span>}
          {" · "}{doc?.meta?.journal} {doc?.meta?.year}
          {doc?.external_id ? ` · PMID ${doc.external_id}` : ""} · {offsets}
          {doc?.source_status === "resolved_match" && (
            <span title="PMID resolves at NCBI and the stored title matches the canonical record"
              style={{ color: "var(--moss)", background: "var(--supports-bg, #E7ECDD)",
                border: "1px solid var(--moss)", borderRadius: 999, padding: "1px 7px", marginLeft: 8,
                letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
              &#10003; NCBI-verified
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */
export default async function SubstratePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: condition, error: condErr } = await supabase
    .from("conditions").select("*").eq("slug", slug).single();
  if (condErr || !condition) notFound();

  const labels = COND_LABELS[slug] ?? [condition.name];

  // Substrate tables may not be applied yet (migrations 046/047). Every query is
  // guarded: on error we treat the substrate as empty and render an honest notice.
  const condEnts = (await supabase.from("entities").select("id,label,ontology_id,ontology_source")
    .eq("type", "condition").in("label", labels)).data ?? [];
  const condIds = condEnts.map((e) => e.id);

  const claimsRes = condIds.length
    ? await supabase.from("claims").select("*").eq("provenance_verified", true).in("condition_id", condIds)
    : { data: [], error: null };
  const claims = (claimsRes.data ?? []) as Claim[];
  const tablesMissing = !!claimsRes.error;

  const interventions = new Map<string, string>();
  const groundMeta = new Map<string, Ground>();
  for (const e of (await supabase.from("entities").select("id,label,ontology_id,ontology_source")
        .eq("type", "intervention")).data ?? []) {
    interventions.set(e.id, e.label);
    if (e.ontology_id) groundMeta.set(e.id, { id: e.ontology_id, source: e.ontology_source });
  }
  for (const e of condEnts) if (e.ontology_id) groundMeta.set(e.id, { id: e.ontology_id, source: e.ontology_source });

  const docs = new Map<string, Doc>();
  for (const d of (await supabase.from("documents").select("id,external_id,url,title,meta,source_status")).data ?? [])
    docs.set(d.id, d as Doc);

  const claimsById = new Map(claims.map((c) => [c.id, c]));
  const contradictions = (condIds.length
    ? (await supabase.from("contradictions").select("*").in("condition_id", condIds)).data ?? []
    : []) as Contradiction[];

  const verifiedCount = claims.length;
  const docCount = new Set(claims.map((c) => c.document_id)).size;

  // group claims by intervention
  const byIntervention = new Map<string, Claim[]>();
  for (const c of claims) {
    const k = c.intervention_id ?? "—";
    (byIntervention.get(k) ?? byIntervention.set(k, []).get(k)!).push(c);
  }
  const groups = [...byIntervention.entries()]
    .map(([id, cs]) => ({ id, label: interventions.get(id) ?? "—", claims: cs }))
    .sort((a, b) => b.claims.length - a.claims.length);

  const empty = claims.length === 0;

  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <nav style={{ ...MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--muted)", marginBottom: 20, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/conditions" style={{ color: "var(--muted)", textDecoration: "none" }}>Conditions</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href={`/conditions/${slug}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
              {condition.name}
            </Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>Substrate</span>
          </nav>

          <p className="eyebrow" style={{ marginBottom: 10 }}>EVIDENCE SUBSTRATE · v0</p>
          <h1 className="font-heading" style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 500,
            lineHeight: 1.08, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 18 }}>
            {condition.name}: what we actually know.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "64ch", marginBottom: 26 }}>
            Atomic claims from the published literature, each <strong>anchored to a verbatim source span</strong>,
            each checked for whether its own quote actually supports it, and disagreements in the evidence
            <strong> surfaced rather than averaged</strong>. This is the substrate layer beneath the signal index,
            built on the same discipline that lets a clinician-researcher trace every statement to its source.
          </p>

          {!empty && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { k: "Documents", v: docCount },
                { k: "Atomic claims", v: claims.length },
                { k: "Provenance-verified", v: verifiedCount },
                { k: "Contradictions surfaced", v: contradictions.length },
              ].map((s) => (
                <div key={s.k} style={{ borderLeft: "1px solid var(--rule-strong)", paddingLeft: 12, minWidth: 130 }}>
                  <p style={{ ...MONO, fontSize: 22, color: "var(--ink)", margin: 0 }}>{s.v}</p>
                  <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--muted)", margin: 0 }}>{s.k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty / not-yet-applied state */}
      {empty && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 8,
            padding: "28px 26px", maxWidth: "64ch" }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>NO SUBSTRATE YET</p>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
              {tablesMissing
                ? "The substrate tables aren’t live yet. Apply migrations 046 (schema) and 047 (PMDD/PMS seed) in Supabase Studio, then reload, and this page reads them directly."
                : `No substrate claims have been indexed for ${condition.name.toLowerCase()} yet. The PMDD/PMS substrate is seeded first; other conditions follow.`}
            </p>
          </div>
        </div>
      )}

      {/* Contradictions */}
      {!empty && (
        <div style={{ borderBottom: "1px solid var(--rule)" }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <p className="eyebrow" style={{ marginBottom: 12 }}>CONTRADICTIONS SURFACED</p>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", fontWeight: 500,
              color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 10 }}>
              Where the evidence disagrees.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch", marginBottom: 24 }}>
              We do not collapse disagreement into a single rating. Where two provenance-verified, source-faithful
              efficacy claims about the same treatment conflict, both are shown side by side with their sources intact.
            </p>

            {contradictions.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                No both-sides-faithful efficacy contradiction in the current corpus.
              </p>
            )}

            {contradictions.map((ct) => {
              const a = claimsById.get(ct.claim_a_id);
              const b = claimsById.get(ct.claim_b_id);
              if (!a || !b) return null;
              const label = ct.intervention_id ? interventions.get(ct.intervention_id) ?? "—" : "—";
              return (
                <div key={ct.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)",
                  borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ ...MONO, fontSize: 12, marginBottom: 10, color: "var(--ink-2)" }}>
                    <span style={{ background: "var(--arm-community)", color: "#FBF8F1", fontSize: 10,
                      letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 3, marginRight: 10 }}>
                      CONTRADICTION
                    </span>
                    <strong style={{ color: "var(--ink)" }}>{label}</strong>
                    <span style={{ color: "var(--muted)" }}>
                      {"  ·  disagreement score "}{ct.nli_score != null ? Number(ct.nli_score).toFixed(2) : "—"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
                    <ClaimCard claim={a} docs={docs} />
                    <div style={{ ...MONO, textAlign: "center", color: "var(--arm-community)", fontSize: 13 }}>vs</div>
                    <ClaimCard claim={b} docs={docs} />
                  </div>
                  {ct.rationale && (
                    <p style={{ fontSize: "0.875rem", color: "var(--ink-2)", marginTop: 10, lineHeight: 1.6 }}>
                      <strong>Why surfaced:</strong> {ct.rationale}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claims by treatment */}
      {!empty && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <p className="eyebrow" style={{ marginBottom: 12 }}>CLAIMS BY TREATMENT</p>
          <h2 className="font-heading" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", fontWeight: 500,
            color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 10 }}>
            {claims.length} claims, every one traceable.
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "62ch", marginBottom: 8 }}>
            Each claim links to its exact source: a verbatim quote, character offsets into the stored document, and
            the PubMed record. <strong>Entailment</strong> records whether the quote actually supports the claim, so that
            a claim that overreaches its own quote is marked <em>neutral</em> and never used to build a contradiction.
          </p>
          <div style={{ marginTop: 22 }}>
            {groups.map((g) => (
              <details key={g.id} open={g.claims.length >= 3}
                style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 8,
                  padding: "8px 16px", marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", padding: "6px 0", fontSize: "0.95rem", color: "var(--ink)" }}>
                  <span style={{ ...MONO, fontWeight: 600 }}>{g.label}</span>
                  <RegistryPill g={groundMeta.get(g.id)} />
                  <span style={{ color: "var(--muted)" }}>{"  ·  "}{g.claims.length} verified claims</span>
                </summary>
                {g.claims.map((c) => <ClaimCard key={c.id} claim={c} docs={docs} />)}
              </details>
            ))}
          </div>

          <p style={{ ...MONO, fontSize: 11, color: "var(--muted)", marginTop: 36, lineHeight: 1.7 }}>
            Built by the Whel substrate pipeline (PubMed → source spans → atomic claims with verified provenance →
            entailment → contradiction surfacing). Extraction + verification: claude-sonnet-4-6. Provenance is verified
            by exact string-matching, not by trusting the model. v0 corpus is PMDD/PMS; deliberately includes
            contested-treatment papers to demonstrate contradiction surfacing.
          </p>
        </div>
      )}
    </main>
  );
}
