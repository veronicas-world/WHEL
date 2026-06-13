"use client";

// ============================================================================
// WHEL — KnowledgeGraph3D
// A compact 3D knowledge-graph object for the hero. Renders the actual
// drug → mechanism → condition substrate, force-settled in 3D, auto-rotating,
// and drag-to-orbit. A picture of the product rather than borrowed iconography.
//
// Two configurations are used on the homepage:
//   • Hero — fuller graph, no labels, drag-to-orbit.
//   • CTA backdrop — sparse graph with labels, non-interactive, auto-spin only.
// ============================================================================

import { useRef, useEffect } from "react";

type Kind = "condition" | "drug" | "mech";
interface GraphData {
  nodes: { id: string; label: string; kind: Kind }[];
  edges: [string, string, string][];
}

// Sparse substrate — the CTA backdrop's ambient mesh.
const GRAPH_COMPACT: GraphData = {
  nodes: [
    { id: "pcos",      label: "PCOS",         kind: "condition" },
    { id: "endo",      label: "Endo.",        kind: "condition" },
    { id: "pmdd",      label: "PMDD",         kind: "condition" },
    { id: "metformin", label: "Metformin",    kind: "drug" },
    { id: "gnrh",      label: "GnRH antag.",  kind: "drug" },
    { id: "ssri",      label: "SSRIs",        kind: "drug" },
    { id: "letrozole", label: "Letrozole",    kind: "drug" },
    { id: "glp1",      label: "GLP-1",        kind: "drug" },
    { id: "ldn",       label: "LDN",          kind: "drug" },
    { id: "insulin",   label: "Insulin",      kind: "mech" },
    { id: "estrogen",  label: "Estrogen",     kind: "mech" },
    { id: "neuro",     label: "Neurosteroid", kind: "mech" },
    { id: "inflam",    label: "Inflam.",      kind: "mech" },
    { id: "aromatase", label: "Aromatase",    kind: "mech" },
  ],
  edges: [
    ["metformin", "insulin", "supports"],   ["insulin", "pcos", "supports"],
    ["glp1", "insulin", "supports"],        ["glp1", "inflam", "supports"],   ["inflam", "endo", "supports"],
    ["gnrh", "estrogen", "supports"],       ["estrogen", "endo", "supports"], ["estrogen", "pcos", "supports"],
    ["letrozole", "aromatase", "supports"], ["aromatase", "estrogen", "supports"], ["aromatase", "pcos", "supports"],
    ["ssri", "neuro", "supports"],          ["neuro", "pmdd", "supports"],
    ["ldn", "inflam", "contradicts"],       ["inflam", "pcos", "supports"],
    ["glp1", "pcos", "supports"],           ["metformin", "pcos", "supports"],
  ],
};

// Fuller substrate — the hero. A single connected graph, kept to a dozen nodes
// so it spreads cleanly inside the box rather than clumping. Drug → mechanism →
// condition, with one contradiction edge for variety.
const GRAPH_DENSE: GraphData = {
  nodes: [
    { id: "pcos",      label: "PCOS",         kind: "condition" },
    { id: "endo",      label: "Endo.",        kind: "condition" },
    { id: "pmdd",      label: "PMDD",         kind: "condition" },
    { id: "metformin", label: "Metformin",    kind: "drug" },
    { id: "gnrh",      label: "GnRH antag.",  kind: "drug" },
    { id: "ssri",      label: "SSRIs",        kind: "drug" },
    { id: "letrozole", label: "Letrozole",    kind: "drug" },
    { id: "insulin",   label: "Insulin",      kind: "mech" },
    { id: "estrogen",  label: "Estrogen",     kind: "mech" },
    { id: "neuro",     label: "Neurosteroid", kind: "mech" },
    { id: "inflam",    label: "Inflam.",      kind: "mech" },
    { id: "aromatase", label: "Aromatase",    kind: "mech" },
  ],
  edges: [
    ["metformin", "insulin", "supports"],   ["insulin", "pcos", "supports"],       ["metformin", "pcos", "supports"],
    ["gnrh", "estrogen", "supports"],       ["estrogen", "endo", "supports"],      ["estrogen", "pcos", "supports"],
    ["letrozole", "aromatase", "supports"], ["aromatase", "estrogen", "supports"], ["aromatase", "pcos", "supports"],
    ["ssri", "neuro", "supports"],          ["neuro", "pmdd", "supports"],         ["neuro", "estrogen", "supports"],
    ["inflam", "endo", "supports"],         ["inflam", "pcos", "supports"],
    ["estrogen", "pmdd", "contradicts"],
  ],
};

// Whel palette (subset used by the object).
const M3 = {
  signal: "#A8E6A3", khaki: "#97955E",
  bone: "#F4EFE6", bone2: "#CBD0BE", moss: "#2E3D2B",
};

// Base node radius (CSS px) by kind, before perspective scaling.
const KIND3: Record<Kind, number> = { condition: 26, drug: 15, mech: 11 };

interface GNode {
  id: string; label: string; kind: Kind;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  r: number; rot: number;
}
interface GEdge { a: GNode; b: GNode; rel: string; }

// 3×3 camera rotation (yaw `ay`, pitch `ax`) of a [x,y,z] point.
function rot3(v: number[], cay: number, say: number, cax: number, sax: number): number[] {
  const X = v[0] * cay - v[2] * say, Z = v[0] * say + v[2] * cay, Y = v[1];
  const Y2 = Y * cax - Z * sax, Z2 = Y * sax + Z * cax;
  return [X, Y2, Z2];
}

interface Props {
  height?: number;
  autoSpin?: number;
  /** Enables drag-to-orbit. */
  interactive?: boolean;
  /** Draw node labels. */
  showLabels?: boolean;
  /** Use the fuller graph (hero) vs. the sparse one (backdrop). */
  dense?: boolean;
  /** World→screen zoom. Lower = nodes closer together / smaller. */
  scaleFactor?: number;
  /** Scale to the full width (backdrop) instead of the smaller box dimension. */
  fillWidth?: boolean;
}

export default function KnowledgeGraph3D({
  height = 480,
  autoSpin = 0.0019,
  interactive = true,
  showLabels = true,
  dense = false,
  scaleFactor = 0.30,
  fillWidth = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current, cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const G = dense ? GRAPH_DENSE : GRAPH_COMPACT;
    let Wd = wrap.clientWidth, Hd = height;

    // seeded RNG so the layout is identical every load
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const nodes: GNode[] = G.nodes.map((n) => ({
      ...n, x: (rnd() - 0.5) * 2, y: (rnd() - 0.5) * 2, z: (rnd() - 0.5) * 2,
      vx: 0, vy: 0, vz: 0, r: KIND3[n.kind], rot: rnd() * Math.PI * 2,
    }));
    const byId: Record<string, GNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const edges: GEdge[] = G.edges.map(([a, b, rel]) => ({ a: byId[a], b: byId[b], rel })).filter((e) => e.a && e.b);

    function resize(): boolean {
      const w = wrap!.clientWidth; if (!w) return false;
      Wd = w; Hd = height;
      cv!.width = Wd * DPR; cv!.height = Hd * DPR;
      cv!.style.height = Hd + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); return true;
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    let visible = true;
    const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 });
    io.observe(wrap);

    // physics in normalized space (repulsion + edge springs + centering)
    function settle() {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          let d2 = dx * dx + dy * dy + dz * dz; if (d2 < 0.04) d2 = 0.04;
          const d = Math.sqrt(d2); let rep = 0.085 / d2;
          if (a.kind === "condition" && b.kind === "condition") rep *= 2.4;
          const fx = (dx / d) * rep, fy = (dy / d) * rep, fz = (dz / d) * rep;
          a.vx += fx; a.vy += fy; a.vz += fz; b.vx -= fx; b.vy -= fy; b.vz -= fz;
        }
      }
      for (const e of edges) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, dz = e.b.z - e.a.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const L0 = (e.a.kind === "condition" || e.b.kind === "condition") ? 1.0 : 0.78;
        const f = (d - L0) * 0.02;
        const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
        e.a.vx += fx; e.a.vy += fy; e.a.vz += fz; e.b.vx -= fx; e.b.vy -= fy; e.b.vz -= fz;
      }
      for (const n of nodes) {
        n.vx += -n.x * 0.012; n.vy += -n.y * 0.012; n.vz += -n.z * 0.012;
        n.vx *= 0.8; n.vy *= 0.8; n.vz *= 0.8;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
      }
    }
    for (let i = 0; i < 220; i++) settle();   // pre-settle so it opens calm

    let ay = 0.6, ax = -0.32, vSpin = 0;
    let dragging = false, sx0 = 0, sy0 = 0, ay0 = 0, ax0 = 0;

    function glyph(n: GNode, sx: number, sy: number, pr: number) {
      const R = n.r * pr;
      if (n.kind === "condition") {                 // target disc
        ctx.beginPath(); ctx.arc(sx, sy, R + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(168,230,163,0.3)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2);
        ctx.fillStyle = M3.moss; ctx.fill();
        ctx.strokeStyle = M3.signal; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, R * 0.42, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(168,230,163,0.5)"; ctx.lineWidth = 1; ctx.stroke();
      } else if (n.kind === "drug") {               // molecular hexagon
        ctx.beginPath(); ctx.arc(sx, sy, R + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20,23,15,0.85)"; ctx.fill();
        ctx.lineJoin = "round"; ctx.lineWidth = 1.5; ctx.strokeStyle = M3.bone2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = n.rot + i * Math.PI / 3; const px = sx + Math.cos(a) * R, py = sy + Math.sin(a) * R; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.stroke();
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i += 2) {
          const a1 = n.rot + i * Math.PI / 3, a2 = n.rot + (i + 1) * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a1) * R * 0.7, sy + Math.sin(a1) * R * 0.7);
          ctx.lineTo(sx + Math.cos(a2) * R * 0.7, sy + Math.sin(a2) * R * 0.7); ctx.stroke();
        }
      } else {                                      // mechanism diamond
        ctx.lineWidth = 1.4; ctx.strokeStyle = M3.khaki;
        ctx.beginPath(); ctx.moveTo(sx, sy - R); ctx.lineTo(sx + R, sy); ctx.lineTo(sx, sy + R); ctx.lineTo(sx - R, sy); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fillStyle = M3.khaki; ctx.fill();
      }
    }

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      if (!visible) return;                         // pause when scrolled offscreen
      const w = wrap!.clientWidth;
      if (w && cv!.width !== Math.round(w * DPR)) { if (!resize()) return; }
      settle();
      if (!dragging) { ay += autoSpin + vSpin; vSpin *= 0.93; }
      nodes.forEach((n) => { if (n.kind === "drug") n.rot += 0.006; });

      const cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
      const scale = (fillWidth ? Wd : Math.min(Wd, Hd)) * scaleFactor;
      const cx = Wd / 2, cy = Hd * 0.5;
      ctx.clearRect(0, 0, Wd, Hd);

      const P: Record<string, { sx: number; sy: number; z: number; pr: number }> = {};
      for (const n of nodes) {
        const r = rot3([n.x, n.y, n.z], cay, say, cax, sax);
        const persp = 5.6 / (5.6 - r[2]);
        P[n.id] = { sx: cx + r[0] * scale * persp, sy: cy + r[1] * scale * persp, z: r[2], pr: persp };
      }

      // edges, back-to-front
      const eord = edges.slice().sort((e1, e2) => (P[e1.a.id].z + P[e1.b.id].z) - (P[e2.a.id].z + P[e2.b.id].z));
      for (const e of eord) {
        const a = P[e.a.id], b = P[e.b.id];
        const zN = ((a.z + b.z) / 2 + 1.4) / 2.8;
        const contradiction = e.rel === "contradicts";
        const alpha = (contradiction ? 0.5 : 0.42) * (0.4 + zN * 0.6);
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
        ctx.lineWidth = 0.8;
        if (contradiction) { ctx.strokeStyle = `rgba(199,122,99,${alpha})`; ctx.setLineDash([4, 4]); }
        else { ctx.strokeStyle = `rgba(151,149,94,${alpha})`; ctx.setLineDash([]); }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // nodes, back-to-front
      const nord = nodes.slice().sort((n1, n2) => P[n1.id].z - P[n2.id].z);
      for (const n of nord) {
        const p = P[n.id];
        glyph(n, p.sx, p.sy, p.pr);
        if (showLabels && (n.kind === "condition" || p.z > 0.35)) {
          ctx.font = (n.kind === "condition" ? "500 12px " : "400 10.5px ") + "'IBM Plex Mono', monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.shadowColor = "#000"; ctx.shadowBlur = 8;
          ctx.fillStyle = n.kind === "condition" ? M3.bone : M3.bone2;
          ctx.fillText(n.label, p.sx, p.sy + n.r * p.pr + 6);
          ctx.shadowBlur = 0;
        }
      }
    }
    frame();

    // drag-to-orbit
    function onDown(ev: MouseEvent) { dragging = true; sx0 = ev.clientX; sy0 = ev.clientY; ay0 = ay; ax0 = ax; cv!.style.cursor = "grabbing"; }
    function onMove(ev: MouseEvent) {
      if (!dragging) return;
      const dx = ev.clientX - sx0, dy = ev.clientY - sy0;
      ay = ay0 + dx * 0.009; ax = Math.max(-1.25, Math.min(0.5, ax0 + dy * 0.007));
      vSpin = dx * 0.00002;
    }
    function onUp() { dragging = false; cv!.style.cursor = "grab"; }

    if (interactive) {
      cv.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    return () => {
      cancelAnimationFrame(rafRef.current); ro.disconnect(); io.disconnect();
      if (interactive) {
        cv.removeEventListener("mousedown", onDown);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
    };
  }, [height, autoSpin, interactive, showLabels, dense, scaleFactor, fillWidth]);

  return (
    <div className="m3-stage" ref={wrapRef}>
      <canvas ref={cvRef} style={{ display: "block", width: "100%", cursor: interactive ? "grab" : "default" }} />
    </div>
  );
}
