"use client";

import { useState, useEffect, useRef, useCallback } from"react";
import { useRouter } from"next/navigation";
import { supabase } from"@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConditionResult {
 type:"condition";
 id: string;
 name: string;
 slug: string;
}

interface CompoundResult {
 type:"compound";
 id: string;
 name: string;
 generic_name: string | null;
 drug_class: string | null;
}

type Result = ConditionResult | CompoundResult;

// ── Search function ────────────────────────────────────────────────────────────
// Typeahead over the condition + medication dictionaries. Full substrate signal
// matching (drug → condition links, synthesis text) lives on the /search page.

async function runSearch(query: string): Promise<Result[]> {
 const q = query.trim();
 if (q.length < 2) return [];

 const [conditionsRes, compoundsRes] = await Promise.all([
 supabase
 .from("conditions")
 .select("id, name, slug")
 .or(`name.ilike.%${q}%,description.ilike.%${q}%,biology_summary.ilike.%${q}%`)
 .limit(5),

 supabase
 .from("compounds")
 .select("id, name, generic_name, drug_class")
 .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,drug_class.ilike.%${q}%,mechanism_of_action.ilike.%${q}%`)
 .limit(6),
 ]);

 const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
 type:"condition",
 id: c.id,
 name: c.name,
 slug: c.slug,
 }));

 const compounds: CompoundResult[] = (compoundsRes.data ?? []).map((c) => ({
 type:"compound",
 id: c.id,
 name: c.name,
 generic_name: c.generic_name ?? null,
 drug_class: c.drug_class ?? null,
 }));

 return [...conditions, ...compounds];
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface SearchBarProps {
 size?:"sm" |"lg";
 onNavigate?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SearchBar({ size ="sm", onNavigate }: SearchBarProps) {
 const [query, setQuery] = useState("");
 const [results, setResults] = useState<Result[]>([]);
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [activeIndex, setActiveIndex] = useState(-1);
 const [searched, setSearched] = useState(false);

 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const router = useRouter();

 const isLg = size ==="lg";

 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClick);
 return () => document.removeEventListener("mousedown", handleClick);
 }, []);

 useEffect(() => {
 setActiveIndex(-1);
 }, [results]);

 const navigate = useCallback(
 (path: string) => {
 setOpen(false);
 setQuery("");
 setResults([]);
 setSearched(false);
 router.push(path);
 onNavigate?.();
 },
 [router, onNavigate]
 );

 function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
 const val = e.target.value;
 setQuery(val);
 if (debounceRef.current) clearTimeout(debounceRef.current);
 if (val.trim().length < 2) {
 setResults([]);
 setOpen(false);
 setSearched(false);
 return;
 }
 debounceRef.current = setTimeout(async () => {
 setLoading(true);
 try {
 const hits = await runSearch(val.trim());
 setResults(hits);
 setSearched(true);
 setOpen(true);
 } finally {
 setLoading(false);
 }
 }, 220);
 }

 function getNavigableItems(): { path: string }[] {
 const items: { path: string }[] = [];
 for (const r of results) {
 if (r.type ==="condition") {
 items.push({ path: `/conditions/${r.slug}` });
 } else {
 items.push({ path: `/search?q=${encodeURIComponent(r.name)}` });
 }
 }
 return items;
 }

 function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
 if (e.key ==="Escape") { setOpen(false); return; }
 const items = getNavigableItems();
 if (e.key ==="ArrowDown") {
 if (!open || items.length === 0) return;
 e.preventDefault();
 setActiveIndex((i) => (i + 1) % items.length);
 } else if (e.key ==="ArrowUp") {
 if (!open || items.length === 0) return;
 e.preventDefault();
 setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
 } else if (e.key ==="Enter") {
 if (activeIndex >= 0 && items.length > 0) {
 e.preventDefault();
 navigate(items[activeIndex].path);
 } else if (query.trim().length >= 2) {
 e.preventDefault();
 navigate(`/search?q=${encodeURIComponent(query.trim())}`);
 }
 }
 }

 const conditionResults = results.filter((r): r is ConditionResult => r.type ==="condition");
 const compoundResults = results.filter((r): r is CompoundResult => r.type ==="compound");
 const hasResults = results.length > 0;

 return (
 <div ref={containerRef} className={`relative ${isLg ?"w-full max-w-xl" :"w-full"}`}>
 {/* Input */}
 <div className="relative">
 <span
 className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
 style={{ color: isLg ? "#111" : "var(--muted)" }}
 >
 <svg
 width={isLg ? 17 : 14}
 height={isLg ? 17 : 14}
 viewBox="0 0 20 20"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <circle cx="9" cy="9" r="6" />
 <line x1="14.5" y1="14.5" x2="19" y2="19" />
 </svg>
 </span>
 <input
 ref={inputRef}
 type="search"
 value={query}
 onChange={handleChange}
 onKeyDown={handleKeyDown}
 onFocus={() => searched && setOpen(true)}
 placeholder={isLg ? "Search conditions, medications, symptoms…" : "Search signals, drugs, mechanisms…"}
 className={`w-full transition focus:outline-none ${
 isLg ?"pl-10 pr-4 py-3 text-base" :"pl-8 pr-3 py-2 text-sm"
 }`}
 style={
 isLg
 ? { border:"1px solid #D8D5CF", backgroundColor:"#fff", color:"#333" }
 : { border:"1px solid var(--rule)", backgroundColor:"var(--bg)", color:"var(--ink)" }
 }
 />
 {loading && (
 <span
 className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
 style={{ color: isLg ? "#111" : "var(--muted)" }}
 >
 …
 </span>
 )}
 </div>

 {/* Dropdown */}
 {open && searched && (
 <div
 className="absolute z-50 mt-1.5 w-full bg-white overflow-hidden"
 style={{ border:"1px solid #E0DDD8", boxShadow:"0 8px 24px rgba(0,0,0,0.10)", minWidth:"260px" }}
 >
 {/* Scrollable results area */}
 <div style={{ maxHeight:"380px", overflowY:"auto" }}>
 {!hasResults && (
 <div className="px-4 py-4">
 <p className="text-sm font-medium mb-1" style={{ color:"#333" }}>No results found</p>
 <p className="text-xs leading-relaxed" style={{ color:"#111" }}>
 Try a condition name, medication, drug class, or symptom keyword.
 </p>
 </div>
 )}

 {/* Conditions */}
 {conditionResults.length > 0 && (
 <div>
 <p className="section-label px-4 pt-3 pb-1.5">
 Conditions
 </p>
 {conditionResults.map((r) => (
 <button
 key={r.id}
 onMouseDown={() => navigate(`/conditions/${r.slug}`)}
 className="w-full text-left px-4 py-2.5 transition-colors"
 onMouseEnter={(e) => (e.currentTarget.style.backgroundColor ="#F5F3EF")}
 onMouseLeave={(e) => (e.currentTarget.style.backgroundColor ="transparent")}
 >
 <p className="text-sm font-medium" style={{ color:"#1a1a1a" }}>{r.name}</p>
 </button>
 ))}
 </div>
 )}

 {/* Medications */}
 {compoundResults.length > 0 && (
 <div style={conditionResults.length > 0 ? { borderTop:"1px solid #F0EDE8" } : {}}>
 <p className="section-label px-4 pt-3 pb-1.5">
 Medications
 </p>
 {compoundResults.map((compound) => (
 <button
 key={compound.id}
 onMouseDown={() => navigate(`/search?q=${encodeURIComponent(compound.name)}`)}
 className="w-full text-left px-4 pt-2.5 pb-2 transition-colors"
 onMouseEnter={(e) => (e.currentTarget.style.backgroundColor ="#F5F3EF")}
 onMouseLeave={(e) => (e.currentTarget.style.backgroundColor ="transparent")}
 >
 <p className="text-sm font-medium" style={{ color:"#1a1a1a" }}>{compound.name}</p>
 {(compound.generic_name || compound.drug_class) && (
 <p className="text-xs mt-0.5" style={{ color:"#111" }}>
 {[compound.generic_name, compound.drug_class].filter(Boolean).join(" ·")}
 </p>
 )}
 </button>
 ))}
 </div>
 )}
 </div>

 {/*"Show all results": pinned outside the scroll area, always visible */}
 {searched && (
 <div style={{ borderTop:"1px solid #E0DDD8" }}>
 <button
 onMouseDown={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
 className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors"
 style={{ color:"#4D5E4D" }}
 onMouseEnter={(e) => (e.currentTarget.style.backgroundColor ="#F5F3EF")}
 onMouseLeave={(e) => (e.currentTarget.style.backgroundColor ="transparent")}
 >
 Show all results
 <span>{"→︎"}</span>
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
