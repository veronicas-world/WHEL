"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ROLES = [
  "Clinician-researcher",
  "Pharma / biotech R&D",
  "Academic / research institution",
  "Advocacy organization",
  "Student",
  "Other",
];

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-newsreader, serif)", fontSize: 15,
  color: "var(--body)", background: "var(--paper)", border: "1px solid var(--line-strong)",
  borderRadius: 2, padding: "10px 12px", marginTop: 6,
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--muted)", display: "block",
};

export default function RequestAccessForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", role: ROLES[0], institution: "", intended_use: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setStatus("submitting");
    const { error } = await supabase.from("access_requests").insert({
      name: form.name.trim() || null,
      email: form.email.trim(),
      role: form.role,
      institution: form.institution.trim() || null,
      intended_use: form.intended_use.trim() || null,
    });
    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 4, padding: "28px 26px" }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: "var(--moss)" }}>You&rsquo;re on the list</div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--body)", margin: 0 }}>
          Thanks, your request is in. Access to the full candidate index and substrate is granted by
          invitation during the research preview; we&rsquo;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 560 }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input style={field} value={form.name} onChange={set("name")} placeholder="Your name" />
      </div>
      <div>
        <label style={labelStyle}>Email *</label>
        <input style={field} type="email" required value={form.email} onChange={set("email")} placeholder="you@institution.org" />
      </div>
      <div>
        <label style={labelStyle}>You are a</label>
        <select style={field} value={form.role} onChange={set("role")}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Institution / company</label>
        <input style={field} value={form.institution} onChange={set("institution")} placeholder="Optional" />
      </div>
      <div>
        <label style={labelStyle}>What would you use it for?</label>
        <textarea style={{ ...field, minHeight: 90, resize: "vertical" }} value={form.intended_use}
          onChange={set("intended_use")} placeholder="Optional, a sentence helps us prioritize." />
      </div>
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Request access"} <span className="arr">→</span>
        </button>
        {status === "error" && (
          <span style={{ color: "var(--brick)", fontSize: 13 }}>
            Something went wrong, please email vla2117@columbia.edu.
          </span>
        )}
      </div>
    </form>
  );
}
