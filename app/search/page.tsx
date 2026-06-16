import Link from"next/link";
import { supabase } from"@/lib/supabase";
import { getCandidates } from"@/lib/substrate-candidates";
import NoSignalsDisclosure from"./NoSignalsDisclosure";
import SearchBar from"../components/SearchBar";

export const metadata = { title:"Search" };

interface ConditionRow { id: string; name: string; slug: string }

async function search(q: string) {
 const ql = q.toLowerCase();
 const [conditionsRes, compoundsRes, allCandidates] = await Promise.all([
 supabase
 .from("conditions")
 .select("id, name, slug")
 .or(`name.ilike.%${q}%,description.ilike.%${q}%,biology_summary.ilike.%${q}%`)
 .limit(20),

 supabase
 .from("compounds")
 .select("id, name, generic_name, drug_class")
 .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,drug_class.ilike.%${q}%,mechanism_of_action.ilike.%${q}%`)
 .limit(20),

 getCandidates(),
 ]);

 const conditions: ConditionRow[] = conditionsRes.data ?? [];

 // Link each matched compound to the conditions it has SUBSTRATE signals for,
 // matched by drug name (the substrate is keyed by entity label, not compound id).
 const compoundRows = (compoundsRes.data ?? []) as { id: string; name: string; generic_name: string | null; drug_class: string | null }[];
 const condsForDrug = (drug: string): ConditionRow[] => {
 const d = drug.toLowerCase();
 const out: ConditionRow[] = [];
 for (const c of allCandidates) {
 const cd = c.drug.toLowerCase();
 if (cd !== d && !cd.includes(d) && !d.includes(cd)) continue;
 const slug = c.conditionId ?? c.condition.toLowerCase();
 if (!out.some((x) => x.slug === slug)) out.push({ id: slug, name: c.condition, slug });
 }
 return out;
 };
 const compounds = compoundRows
 .map((c) => ({ ...c, conditions: condsForDrug(c.name) }))
 .sort((a, b) => (b.conditions.length > 0 ? 1 : 0) - (a.conditions.length > 0 ? 1 : 0));

 // Signals: substrate candidates whose drug, condition, or synthesis matches.
 const signalMap = new Map<string, { id: string; summary: string; condition: ConditionRow }>();
 for (const c of allCandidates) {
 const hay = `${c.drug} ${c.condition} ${c.rationale} ${c.mechanism}`.toLowerCase();
 if (!hay.includes(ql)) continue;
 const slug = c.conditionId ?? c.condition.toLowerCase();
 const key = c.signalId ?? `${c.drug}-${slug}`;
 if (signalMap.has(key)) continue;
 signalMap.set(key, {
 id: key,
 summary: `${c.drug} → ${c.condition}: ${c.rationale}`,
 condition: { id: slug, name: c.condition, slug },
 });
 if (signalMap.size >= 20) break;
 }

 return {
 conditions,
 compounds,
 signals: Array.from(signalMap.values()),
 };
}

export default async function SearchPage({
 searchParams,
}: {
 searchParams: Promise<{ q?: string }>;
}) {
 const { q: raw } = await searchParams;
 const q = raw?.trim() ??"";

 const isEmpty = q.length < 2;
 const { conditions, compounds, signals } = isEmpty
 ? { conditions: [], compounds: [], signals: [] }
 : await search(q);

 const total = conditions.length + compounds.length + signals.length;

 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>
 {/* Header */}
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color:"#111" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <span style={{ color:"#4D5E4D" }}>Search</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-6"
 style={{ color:"#1a1a1a" }}
 >
 {isEmpty ?"Search" : <>Results for &ldquo;{q}&rdquo;</>}
 </h1>
 <div className="max-w-xl">
 <SearchBar size="lg" />
 </div>
 {!isEmpty && (
 <p className="text-sm mt-3" style={{ color:"#111" }}>
 {total} result{total !== 1 ?"s" :""} across conditions, medications, and signals
 </p>
 )}
 </div>
 </div>

 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 {isEmpty && (
 <p className="text-sm" style={{ color:"#111" }}>
 Enter a search term above to see results.
 </p>
 )}

 {!isEmpty && total === 0 && (
 <p className="text-sm" style={{ color:"#111" }}>
 No results for &ldquo;{q}&rdquo;. Try a condition name, medication, drug class, or symptom keyword.
 </p>
 )}

 {!isEmpty && total > 0 && (
 <div className="space-y-14">

 {/* Conditions */}
 {conditions.length > 0 && (
 <section>
 <div className="flex items-baseline gap-4 mb-8">
 <h2 className="section-label">Conditions</h2>
 <span className="text-sm" style={{ color:"#111" }}>{conditions.length} result{conditions.length !== 1 ?"s" :""}</span>
 </div>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {conditions.map((c) => (
 <Link
 key={c.id}
 href={`/conditions/${c.slug}`}
 className="group block bg-white p-6 sm:p-8 transition-shadow hover:shadow-md"
 style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
 >
 <h3 className="font-heading text-xl mb-4 group-hover:opacity-75 transition-opacity" style={{ color:"#1a1a1a" }}>
 {c.name}
 </h3>
 <p className="text-sm font-medium" style={{ color:"#4D5E4D" }}>{"View Research Signals →︎"}</p>
 </Link>
 ))}
 </div>
 </section>
 )}

 {/* Medications */}
 {compounds.length > 0 && (() => {
 const linked = compounds.filter((c) => c.conditions.length > 0);
 const unlinked = compounds.filter((c) => c.conditions.length === 0);
 return (
 <section>
 <div className="flex items-baseline gap-4 mb-8">
 <h2 className="section-label">Medications</h2>
 <span className="text-sm" style={{ color:"#111" }}>{linked.length} result{linked.length !== 1 ?"s" :""}</span>
 </div>

 {linked.length > 0 && (
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {linked.map((c) => (
 <div key={c.id} className="bg-white p-6 sm:p-8" style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
 <p className="font-heading text-xl mb-1" style={{ color:"#1a1a1a" }}>{c.name}</p>
 {(c.generic_name || c.drug_class) && (
 <p className="text-xs mb-3" style={{ color:"#111" }}>
 {[c.generic_name, c.drug_class].filter(Boolean).join(" ·")}
 </p>
 )}
 <div className="space-y-2 mt-3">
 {c.conditions.map((cond) => (
 <Link
 key={cond.id}
 href={`/conditions/${cond.slug}`}
 className="block text-sm font-medium transition-opacity hover:opacity-70"
 style={{ color:"#4D5E4D" }}
 >
 {"→︎"} {cond.name}
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}

 <NoSignalsDisclosure compounds={unlinked} />
 </section>
 );
 })()}

 {/* Signals */}
 {signals.length > 0 && (
 <section>
 <div className="flex items-baseline gap-4 mb-8">
 <h2 className="section-label">Signals</h2>
 <span className="text-sm" style={{ color:"#111" }}>{signals.length} result{signals.length !== 1 ?"s" :""}</span>
 </div>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {signals.map((s) => (
 <Link
 key={s.id}
 href={`/conditions/${s.condition.slug}`}
 className="group block bg-white p-6 sm:p-8 transition-shadow hover:shadow-md"
 style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
 >
 <p className="text-sm leading-relaxed mb-4 line-clamp-4" style={{ color:"#444" }}>{s.summary}</p>
 <p className="text-sm font-medium group-hover:opacity-75 transition-opacity" style={{ color:"#4D5E4D" }}>
 {"→︎"} {s.condition.name}
 </p>
 </Link>
 ))}
 </div>
 </section>
 )}

 </div>
 )}
 </div>
 </main>
 );
}
