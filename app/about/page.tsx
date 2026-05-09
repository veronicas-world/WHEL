export const metadata = {
 title: "About",
};

export default function AboutPage() {
 return (
 <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
 <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color: "#111" }}>
 <span>Home</span>
 <span className="mx-2">›</span>
 <span style={{ color: "#4D5E4D" }}>About</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color: "#1a1a1a" }}
 >
 About
 </h1>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-14">

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 How This Started
 </h2>
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 WHEL began with a personal experience. A few years ago, I was diagnosed with a prolactinoma — a noncancerous tumor of the pituitary gland that disrupts hormonal regulation — and eventually underwent brain surgery to remove it. The standard treatment before surgery, and for many people instead of surgery, is dopamine agonists like cabergoline or bromocriptine, which are effective but, for many patients including myself, quite rough. Common side effects include extreme nausea, psychiatric symptoms, and impulse control disorders. The drugs work, but &ldquo;working&rdquo; is not the same as &ldquo;working well,&rdquo; and for many people who take them over years, the calculation is not clean.
 </p>
 <p>
 I got through it. And I am aware, acutely, that I had it relatively easy. A prolactinoma is not endometriosis, or PMDD, or eight years of being told your pain is normal, to come back in six months, to try exercise. I had a diagnosis, a treatment, a surgery, and a recovery. Many women with reproductive and hormonal conditions do not get that clean of an arc.
 </p>
 <p>
 That realization — along with a lot of late night PubMed rabbit holes and conversations with my mother, who is a psychiatrist and has spent a long time thinking about women&apos;s hormonal conditions — eventually turned into this project. We built it together.
 </p>
 </div>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Why Women&apos;s Hormonal Health
 </h2>
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 Medical knowledge has structural blind spots. The NIH did not require inclusion of women in clinical research until 1993{" "}
 <a href="https://www.congress.gov/bill/103rd-congress/senate-bill/1" target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2" style={{ color: "#4D5E4D" }}>[NIH Revitalization Act of 1993]</a>,{" "}
 which means the past thirty years have been spent catching up from a standing start. Conditions that affect women most severely have historically been underfunded, and where a research base exists at all, it is thin.
 </p>
 <p>
 The consequences are not abstract. Endometriosis affects up to 10% of women of reproductive age, yet the average diagnostic delay is still 7 to 10 years{" "}
 <a href="https://pubmed.ncbi.nlm.nih.gov/21718982/" target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2" style={{ color: "#4D5E4D" }}>[Nnoaham et al., 2011]</a>,{" "}
 and in 2026 there is no pharmaceutical treatment that addresses the underlying condition rather than suppressing symptoms. PMDD is clinically severe and cyclical, yet is still treated primarily with SSRIs prescribed imprecisely. Adenomyosis, vulvodynia, and PCOS are chronically underrepresented in the research literature. Menopause — a biological transition affecting every woman who lives long enough — is widely acknowledged to be poorly managed.
 </p>
 <p>
 The problem is not that researchers do not care. It is structural: poorly characterized mechanisms make conditions harder to study, which makes them less fundable, which means the mechanisms remain poorly characterized. It is a feedback loop. WHEL is an attempt to interrupt it.
 </p>
 </div>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Why Drug Repurposing
 </h2>
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 Drug repurposing asks a different question than traditional drug discovery. Instead of designing a new drug from scratch, you look at what is already on the market — where the safety profile is at least partially known — and search for unexpected benefits or patterns in existing data that suggest a new use case. If a drug already has a known safety profile, the path to clinical investigation is shorter. You do not have to start from scratch. You just have to find the signals.
 </p>
 <p>
 The surprising thing is that the signals are often already there. Somewhere in a published trial, an adverse event database, or a Reddit thread from two years ago, someone noticed that women on statins were reporting reduced period pain. Someone noticed that a drug developed for one condition was doing something unexpected for another. The data exists. It is just scattered across PubMed, clinical trial registries, adverse event databases, and patient community forums — and no one has built a clean, accessible tool that pulls it together specifically for women&apos;s hormonal health.
 </p>
 <p>
 My mother — who brought what she called a &ldquo;two-arm data strategy&rdquo; to this project — framed it clearly: the absence of direct evidence is not the same as the absence of evidence. Sparseness in the research literature is itself information. And signals from unexpected places are hypotheses. They are different kinds of data, and they deserve to be presented differently.
 </p>
 </div>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 What WHEL Does
 </h2>
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 WHEL currently covers six conditions — endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, and menopause — and organizes evidence into four research arms. Direct Research pulls published studies and active clinical trials specifically targeting each condition. Cross-Condition Signals identifies drugs developed for other purposes where women incidentally reported benefit, drawing on the FDA adverse event database and secondary endpoints buried in unrelated trials. Pathway Insights surfaces drugs that worsen conditions — because understanding what makes something worse is often a legitimate path to understanding what drives it. Community Forum Reports mines consistent treatment patterns across condition specific subreddits, clearly labeled as community signal rather than clinical evidence.
 </p>
 <p>
 Each signal is classified by evidence strength — Strong, Moderate, Emerging, or Exploratory — and every result links to its source. The goal is not to tell anyone what to take. It is to make visible the hypotheses that exist in the data but have not yet been formally investigated.
 </p>
 <p>
 This is a starting point. The plan is to expand the condition set, improve the pipelines, and incorporate feedback from researchers, clinicians, and patients about which gaps matter most.
 </p>
 </div>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Our Goal
 </h2>
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 WHEL is free, open, and not a monetization project. Nothing here is medical advice. It is a research signal aggregator, built by a philosophy student and her psychiatrist mother, for anyone who wants to understand what the evidence does and does not say about conditions that have not received the research attention they deserve.
 </p>
 <p>
 The idea that a drug developed for cholesterol might contain, embedded in its trial data, a signal about period pain — that is a claim about the structure of knowledge itself. Useful truths can be present in data before anyone knows to look for them. We wanted to build something that went looking.
 </p>
 </div>
 </section>

 </div>
 </div>
 </main>
 );
}
