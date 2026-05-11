import Link from"next/link";
import BackLink from"../../components/BackLink";

export const metadata = {
 title:"More Information",
};

export default function MoreInformationPage() {
 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color:"#111" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <Link href="/about" className="hover:underline">About</Link>
 <span className="mx-2">›</span>
 <span style={{ color:"#4D5E4D" }}>More Information</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight"
 style={{ color:"#1a1a1a" }}
 >
 More Information
 </h1>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-14">

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Project Background
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 A detailed account of how this project was conceived and built is available in the{" "}
 <a
 href="https://veronicaagudelo.substack.com/p/my-first-project-womens-health-evidence"
 target="_blank"
 rel="noopener noreferrer"
 className="font-medium underline underline-offset-2 hover:opacity-75"
 style={{ color:"#4D5E4D" }}
 >
 project write-up
 </a>
 .
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-8" style={{ color:"#1a1a1a" }}>
 Technical Architecture
 </h2>
 <div className="space-y-10">

 {/* Stack */}
 <div>
 <h3 className="font-heading text-base font-semibold mb-3" style={{ color:"#1a1a1a" }}>
 Stack and Infrastructure
 </h3>
 <ul className="space-y-2 text-sm leading-relaxed" style={{ color:"#111" }}>
 {[
"Next.js (TypeScript) frontend deployed on Vercel.",
"Supabase (PostgreSQL) as the primary database.",
"GitHub for version control with automatic Vercel deployments on push.",
 ].map((item) => (
 <li key={item} className="flex gap-3">
 <span className="mt-1 shrink-0" style={{ color:"#111" }}>·</span>
 <span>{item}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Pipelines */}
 <div>
 <h3 className="font-heading text-base font-semibold mb-4" style={{ color:"#1a1a1a" }}>
 Data Pipelines
 </h3>
 <div className="space-y-5">

 {[
 {
 name:"PubMed pipeline",
 file:"scripts/research-pipeline.js",
 body:"Queries the NCBI E-utilities API using condition specific search terms. Fetches up to 20 abstracts per query using esearch and efetch endpoints. Sends abstracts in batches to the Claude API (claude-sonnet-4-5) with a system prompt instructing it to identify repurposing signals. Claude returns structured JSON with compound name, signal type, evidence strength, summary, mechanism hypothesis, and PMIDs. The pipeline parses this JSON and generates parameterized SQL INSERT statements with ON CONFLICT DO UPDATE handling.",
 },
 {
 name:"OpenFDA pipeline",
 file:"scripts/openfda-pipeline.js",
 body:"Queries the FDA Adverse Event Monitoring System (AEMS, formerly FAERS) via the OpenFDA REST API. Uses a two pass approach: Pass 1 queries female patients who reported gynecological or condition relevant reactions while taking the target drug. Pass 2 pulls a general sample of female patient reports for baseline context. Filters for reactions with two or more reports to exclude single report noise. Sends reaction frequency summaries to Claude for analysis. Each signal links directly to the live OpenFDA query URL for verification.",
 },
 {
 name:"ClinicalTrials.gov pipeline",
 file:"scripts/clinicaltrials-pipeline.js",
 body:"Queries the ClinicalTrials.gov v2 API for registered trials involving the target drug. Extracts posted adverse event tables where available. Sends relevant trial data to Claude to identify any gynecological or condition relevant findings reported as secondary outcomes or adverse events.",
 },
 {
 name:"Reddit pipeline",
 file:"scripts/reddit-pipeline.js",
 body:"Queries public Reddit communities (r/Endo, r/endometriosis, r/PCOS, r/PMDD, r/Menopause, r/Perimenopause, r/vulvodynia) using Reddit's public JSON search API without authentication. Runs 8 treatment focused search queries per subreddit including terms like \"what helped\", \"off label\", \"anyone tried\", and \"worked for me\". Collects up to 25 top posts per query, deduplicates by post ID, and sends titles and post bodies to Claude. Claude is instructed to identify only treatments mentioned independently by two or more users, with emphasis on off-label or unexpected use cases. Individual post URLs and titles are stored as source entries.",
 },
 ].map(({ name, file, body }) => (
 <div
 key={name}
 className="bg-white p-5"
 style={{ border:"1px solid #E0DDD8" }}
 >
 <p className="text-sm font-semibold mb-0.5" style={{ color:"#1a1a1a" }}>{name}</p>
 <p className="text-xs mb-3 font-mono" style={{ color:"#111" }}>{file}</p>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>{body}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Signal selection */}
 <div>
 <h3 className="font-heading text-base font-semibold mb-3" style={{ color:"#1a1a1a" }}>
 Signal Selection Logic
 </h3>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 Claude acts as the classification layer across all four pipelines. For each pipeline the model receives raw data (abstracts, reaction frequency tables, trial data, or forum posts) and a system prompt defining what constitutes a signal worth surfacing. The key filtering criteria are: recurrence (a finding must appear in multiple sources or reports, not just once), relevance to one of the six conditions, and whether the compound was originally developed for a different indication. Claude returns structured JSON which the pipeline scripts convert to SQL. Signal type and evidence strength are assigned by Claude based on the data source and the nature of the finding.
 </p>
 </div>

 {/* Schema */}
 <div>
 <h3 className="font-heading text-base font-semibold mb-3" style={{ color:"#1a1a1a" }}>
 Database Schema
 </h3>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 Five core tables: <span className="font-mono text-xs" style={{ color:"#111" }}>conditions</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>compounds</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>repurposing_signals</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>sources</span>, and <span className="font-mono text-xs" style={{ color:"#111" }}>cross_condition_patterns</span>. Repurposing signals link compounds to conditions via foreign keys. Sources link to signals and carry source type metadata (<span className="font-mono text-xs" style={{ color:"#111" }}>pubmed</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>faers</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>clinical_trial</span>, <span className="font-mono text-xs" style={{ color:"#111" }}>reddit</span>) which determines which frontend tab a signal appears in. A unique constraint on <span className="font-mono text-xs" style={{ color:"#111" }}>(compound_id, condition_id)</span> prevents duplicate signals and enables upsert behavior on pipeline reruns.
 </p>
 </div>

 {/* Frontend routing */}
 <div>
 <h3 className="font-heading text-base font-semibold mb-3" style={{ color:"#1a1a1a" }}>
 Frontend Signal Routing
 </h3>
 <p className="text-sm leading-relaxed mb-4" style={{ color:"#111" }}>
 Tab assignment on condition detail pages is determined at render time by reading the <span className="font-mono text-xs" style={{ color:"#111" }}>source_type</span> of each signal&apos;s associated sources.
 </p>
 <ul className="space-y-2 text-sm leading-relaxed" style={{ color:"#111" }}>
 {[
 ["pubmed, clinical_trial","Direct Research tab"],
 ["faers, sider","Cross-Condition Signals tab"],
 ["pathway_signal, caution_signal (signal_type)","Pathway Insights tab"],
 ["reddit","Community Forum Reports tab"],
 ].map(([source, dest]) => (
 <li key={source} className="flex gap-3 items-baseline">
 <span className="mt-1 shrink-0" style={{ color:"#111" }}>·</span>
 <span>
 <span className="font-mono text-xs" style={{ color:"#111" }}>{source}</span>
 {" →︎"}
 {dest}
 </span>
 </li>
 ))}
 </ul>
 </div>

 </div>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Contact
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 For questions, research collaborations, or feedback, reach out at{" "}
 <a
 href="mailto:vla2117@columbia.edu"
 className="font-medium hover:underline underline-offset-2"
 style={{ color:"#4D5E4D" }}
 >
 vla2117@columbia.edu
 </a>
 .
 </p>
 </section>

 <div style={{ borderTop:"1px solid #E0DDD8", paddingTop:"2rem" }}>
 <BackLink href="/" label="Back to home" />
 </div>

 </div>
 </div>
 </main>
 );
}
