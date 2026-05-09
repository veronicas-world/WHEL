import Link from"next/link";
import { notFound } from"next/navigation";
import { supabase } from"@/lib/supabase";
import ResearchSignalsTabs, { type Signal } from"./ResearchSignalsTabs";

export async function generateMetadata({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const { data } = await supabase
 .from("conditions")
 .select("name")
 .eq("slug", slug)
 .single();
 return { title: data?.name ??"Condition" };
}

export default async function ConditionDetailPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;

 const { data: condition, error: conditionError } = await supabase
 .from("conditions")
 .select("*")
 .eq("slug", slug)
 .single();

 if (conditionError || !condition) {
 notFound();
 }

 const { data: signals } = await supabase
 .from("repurposing_signals")
 .select(
 `
 id,
 signal_type,
 evidence_strength,
 confidence_tier,
 replication_score,
 source_quality_score,
 specificity_score,
 plausibility_score,
 direction_score,
 total_evidence_score,
 effect_direction,
 replication_level,
 plausibility_level,
 summary,
 mechanism_hypothesis,
 status,
 compounds (
 name,
 generic_name,
 drug_class,
 fda_status
 ),
 sources (
 id,
 source_type,
 external_id,
 title,
 authors,
 journal,
 publication_date,
 url,
 key_finding_excerpt
 )
 `
 )
 .eq("condition_id", condition.id)
 .order("created_at");

 const hasSecondaryInfo = condition.biology_summary || condition.underfunding_notes;

 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>

 {/* ── Page header / condition hero ─────────────────────────────────── */}
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 {/* Breadcrumb */}
 <nav className="flex items-center gap-1.5 text-xs mb-5" style={{ color:"#111" }}>
 <Link href="/" className="transition-colors hover:underline" style={{ color:"#4D5E4D" }}>
 Home
 </Link>
 <span>›</span>
 <Link href="/conditions" className="transition-colors hover:underline" style={{ color:"#4D5E4D" }}>
 Conditions
 </Link>
 <span>›</span>
 <span>{condition.name}</span>
 </nav>

 {/* Condition name */}
 <h1
 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight"
 style={{ color:"#1a1a1a" }}
 >
 {condition.name}
 </h1>

 {/* Description */}
 {condition.description && (
 <p
 className="text-base sm:text-lg leading-relaxed max-w-3xl"
 style={{ color:"#444" }}
 >
 {condition.description}
 </p>
 )}

 {/* Freshness timestamp */}
 <p className="text-xs mt-4" style={{ color:"#999" }}>
 Signals last updated: May 2026
 </p>
 </div>
 </div>

 {/* ── Key facts strip ───────────────────────────────────────────────── */}
 {(condition.prevalence_summary || condition.treatment_gap_summary) && (
 <div style={{ backgroundColor:"#EDEAE4", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
 <div className="grid gap-6 sm:grid-cols-2">
 {condition.prevalence_summary && (
 <div className="flex gap-4">
 <div
 className="w-1 shrink-0"
 style={{ backgroundColor:"#4D5E4D" }}
 />
 <div>
 <p
 className="text-[10px] uppercase tracking-widest font-semibold mb-1"
 style={{ color:"#111" }}
 >
 Prevalence
 </p>
 <p className="text-sm leading-relaxed" style={{ color:"#444" }}>
 {condition.prevalence_summary}
 </p>
 </div>
 </div>
 )}
 {condition.treatment_gap_summary && (
 <div className="flex gap-4">
 <div
 className="w-1 shrink-0"
 style={{ backgroundColor:"#4D5E4D" }}
 />
 <div>
 <p
 className="text-[10px] uppercase tracking-widest font-semibold mb-1"
 style={{ color:"#111" }}
 >
 Treatment Gap
 </p>
 <p className="text-sm leading-relaxed" style={{ color:"#444" }}>
 {condition.treatment_gap_summary}
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* ── Main content ──────────────────────────────────────────────────── */}
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

 {/* Secondary info panels */}
 {hasSecondaryInfo && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
 {condition.biology_summary && (
 <div
 className="bg-white p-6"
 style={{ border:"1px solid #E0DDD8" }}
 >
 <p
 className="text-[10px] uppercase tracking-widest font-semibold mb-3"
 style={{ color:"#111" }}
 >
 Biology
 </p>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 {condition.biology_summary}
 </p>
 </div>
 )}
 {condition.underfunding_notes && (
 <div
 className="bg-white p-6"
 style={{ border:"1px solid #E0DDD8" }}
 >
 <p
 className="text-[10px] uppercase tracking-widest font-semibold mb-3"
 style={{ color:"#111" }}
 >
 Research &amp; Funding Context
 </p>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 {condition.underfunding_notes}
 </p>
 </div>
 )}
 </div>
 )}

 {/* Repurposing Signals */}
 <div>
 <div className="mb-8 pb-5" style={{ borderBottom:"1px solid #E0DDD8" }}>
 <h2
 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-2"
 style={{ color:"#1a1a1a" }}
 >
 Repurposing Signals
 </h2>
 <p className="text-sm" style={{ color:"#111" }}>
 Existing drugs with published evidence for this condition.
 </p>
 </div>

 <ResearchSignalsTabs signals={(signals ?? []) as unknown as Signal[]} />
 </div>

 </div>
 </main>
 );
}
