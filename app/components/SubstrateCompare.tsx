"use client";

import { useRef, useEffect } from "react";

interface PanelProps {
  tone: "dark" | "light";
  count: number;
  edgeCount: number;
  dense: boolean;
  label: string;
  sub: string;
}

function AnimatedPanel({ tone, count, edgeCount, dense, label, sub }: PanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let Wd = wrap.clientWidth, Hd = 230;
    let seed = dense ? 19 : 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const pts = Array.from({ length: count }, (_, i) => ({
      x: 22 + rnd() * (Wd - 44), y: 20 + rnd() * (Hd - 72),
      mol: dense && i % 3 === 0, hub: i % 6 === 0,
    }));
    const edges = pts.slice(0, edgeCount).map((p, i) => ({ a: p, b: pts[(i * 3 + 2) % pts.length] }));

    function resize() {
      Wd = wrap!.clientWidth;
      cv!.width = Wd * DPR; cv!.height = Hd * DPR;
      cv!.style.height = Hd + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      pts.forEach(p => { if (p.x > Wd - 22) p.x = Wd - 22; });
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let prog = 0, hold = 0, rot = 0;

    function molecule(x: number, y: number, R: number, c: string) {
      ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + i * Math.PI / 3;
        const px = x + Math.cos(a) * R, py = y + Math.sin(a) * R;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }

    function frame() {
      ctx.clearRect(0, 0, Wd, Hd);
      rot += 0.01;
      if (hold > 0) { hold--; if (hold === 0) prog = 0; }
      else { prog += dense ? 0.006 : 0.012; if (prog >= 1) { prog = 1; hold = 160; } }
      const shown = Math.floor(prog * pts.length);
      const edgeCol = tone === "dark" ? "rgba(151,149,94,0.55)" : "rgba(26,29,20,0.18)";
      ctx.strokeStyle = edgeCol; ctx.lineWidth = dense ? 1 : 0.7;
      edges.forEach(e => {
        if (pts.indexOf(e.a) < shown && pts.indexOf(e.b) < shown) {
          ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
        }
      });
      pts.forEach((p, i) => {
        if (i >= shown) return;
        if (tone === "dark") {
          if (p.mol) { molecule(p.x, p.y, 5.5, p.hub ? "#A8E6A3" : "#CBD0BE"); }
          else {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.hub ? 4 : 2.6, 0, Math.PI * 2);
            ctx.fillStyle = p.hub ? "#A8E6A3" : "#F4EFE6"; ctx.fill();
          }
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(26,29,20,0.42)"; ctx.fill();
        }
      });
      rafRef.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [tone, count, edgeCount, dense]);

  return (
    <div style={{
      background: tone === "dark" ? "var(--moss-deep)" : "var(--bone-2)",
      border: "1px solid " + (tone === "dark" ? "var(--ink-line)" : "var(--line-strong)"),
    }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <canvas ref={cvRef} style={{ display: "block", width: "100%" }} />
      </div>
      <div style={{ padding: "14px 18px", borderTop: "1px solid " + (tone === "dark" ? "var(--ink-line)" : "var(--line)") }}>
        <div style={{
          fontFamily: "var(--font-plex-mono, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: tone === "dark" ? "var(--signal)" : "var(--muted)",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 16, marginTop: 6,
          color: tone === "dark" ? "var(--on-ink)" : "var(--body)",
        }}>{sub}</div>
      </div>
    </div>
  );
}

export default function SubstrateCompare() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
      <AnimatedPanel tone="light" count={24} edgeCount={11} dense={false}
        label="Inherited"
        sub="Male-default knowledge graph — sparse for female biology." />
      <AnimatedPanel tone="dark" count={66} edgeCount={42} dense={true}
        label="Corrected"
        sub="Sex-specific drugs, mechanisms, and the relations between them." />
    </div>
  );
}
