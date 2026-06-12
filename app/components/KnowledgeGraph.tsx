"use client";

import { useRef, useEffect } from "react";

const GRAPH_NODES = [
  { id: "pcos",     label: "PCOS",        kind: "condition" },
  { id: "endo",     label: "Endo.",        kind: "condition" },
  { id: "pmdd",     label: "PMDD",         kind: "condition" },
  { id: "metformin",label: "Metformin",    kind: "drug" },
  { id: "gnrh",     label: "GnRH antag.", kind: "drug" },
  { id: "ssri",     label: "SSRIs",        kind: "drug" },
  { id: "letrozole",label: "Letrozole",    kind: "drug" },
  { id: "glp1",     label: "GLP-1",        kind: "drug" },
  { id: "ldn",      label: "LDN",          kind: "drug" },
  { id: "insulin",  label: "Insulin",      kind: "mech" },
  { id: "estrogen", label: "Estrogen",     kind: "mech" },
  { id: "neuro",    label: "Neurosteroid", kind: "mech" },
  { id: "inflam",   label: "Inflam.",      kind: "mech" },
  { id: "aromatase",label: "Aromatase",    kind: "mech" },
] as const;

const GRAPH_EDGES: [string, string, string][] = [
  ["metformin","insulin","supports"], ["insulin","pcos","supports"],
  ["glp1","insulin","supports"], ["glp1","inflam","supports"], ["inflam","endo","supports"],
  ["gnrh","estrogen","supports"], ["estrogen","endo","supports"], ["estrogen","pcos","supports"],
  ["letrozole","aromatase","supports"], ["aromatase","estrogen","supports"], ["aromatase","pcos","supports"],
  ["ssri","neuro","supports"], ["neuro","pmdd","supports"],
  ["ldn","inflam","contradicts"], ["inflam","pcos","supports"],
  ["glp1","pcos","supports"], ["metformin","pcos","supports"],
];

const KIND_STYLE = {
  condition: { fill: "#2E3D2B", stroke: "#A8E6A3", text: "#F4EFE6", r: 27 },
  drug:      { fill: "#F4EFE6", stroke: "#97955E", text: "#CBD0BE", r: 16 },
  mech:      { fill: "transparent", stroke: "#97955E", text: "#9B9170", r: 13 },
};

interface Node {
  id: string; label: string; kind: "condition" | "drug" | "mech";
  x: number; y: number; vx: number; vy: number;
  rad: number; rot: number; spin: number; rings: number;
}
interface Edge { a: Node; b: Node; rel: string; }

export default function KnowledgeGraph({ height = 460 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const hoverRef = useRef<Node | null>(null);
  const stateRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = wrap.clientWidth, H = height;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const nodes: Node[] = GRAPH_NODES.map((n, i) => {
      const ang = (i / GRAPH_NODES.length) * Math.PI * 2;
      const rad = n.kind === "condition" ? 140 : n.kind === "mech" ? 90 : 200;
      return {
        ...n,
        x: W / 2 + Math.cos(ang) * rad + (Math.random() - 0.5) * 40,
        y: H / 2 + Math.sin(ang) * rad * 0.7 + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
        rad: KIND_STYLE[n.kind].r,
        rot: Math.random() * Math.PI * 2,
        spin: (0.0016 + Math.random() * 0.0026) * (Math.random() < 0.5 ? 1 : -1),
        rings: n.kind === "drug" ? (i % 3 === 0 ? 5 : 6) : 0,
      };
    });

    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const edges: Edge[] = GRAPH_EDGES
      .map(([a, b, rel]) => ({ a: byId[a], b: byId[b], rel }))
      .filter(e => e.a && e.b);

    stateRef.current = { nodes, edges };

    function resize() {
      W = wrap!.clientWidth; H = height;
      canvas!.width = W * DPR; canvas!.height = H * DPR;
      canvas!.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function drawMolecule(x: number, y: number, R: number, rot: number, stroke: string, ring: number) {
      const N = ring || 6;
      const pts: [number, number][] = [];
      for (let i = 0; i < N; i++) {
        const a = rot + i * (Math.PI * 2 / N);
        pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R]);
      }
      ctx.beginPath(); ctx.arc(x, y, R + 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16,12,14,0.82)"; ctx.fill();
      ctx.lineJoin = "round"; ctx.lineWidth = 1.5; ctx.strokeStyle = stroke;
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1;
      for (let i = 0; i < N; i += 2) {
        const a = pts[i], b = pts[(i + 1) % N];
        const ax = x + (a[0] - x) * 0.7, ay = y + (a[1] - y) * 0.7;
        const bx = x + (b[0] - x) * 0.7, by = y + (b[1] - y) * 0.7;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      const pa = pts[0];
      const ox = x + (pa[0] - x) * 1.62, oy = y + (pa[1] - y) * 1.62;
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(ox, oy); ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, oy, 1.9, 0, Math.PI * 2); ctx.fillStyle = stroke; ctx.fill();
    }

    function drawPathway(x: number, y: number, R: number, lit: boolean) {
      const c = lit ? "#A8E6A3" : "#97955E";
      ctx.lineWidth = 1.4; ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, y - R); ctx.lineTo(x + R, y); ctx.lineTo(x, y + R); ctx.lineTo(x - R, y); ctx.closePath();
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    }

    let pulse = 0;

    function step() {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1;
          const d = Math.sqrt(d2);
          let rep = 7000 / d2;
          if (a.kind === "condition" && b.kind === "condition") rep *= 3.2;
          else if (a.kind === "mech" && b.kind === "mech") rep *= 2.0;
          const fx = (dx / d) * rep, fy = (dy / d) * rep;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      for (const e of edges) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = e.a.kind === "condition" || e.b.kind === "condition" ? 168 : 124;
        const f = (d - target) * 0.012;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        e.a.vx += fx; e.a.vy += fy; e.b.vx -= fx; e.b.vy -= fy;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.001;
        n.vy += (H / 2 - n.y) * 0.0013;
        n.vx *= 0.86; n.vy *= 0.86;
        if (n !== hoverRef.current) { n.x += n.vx; n.y += n.vy; }
        if (n.kind === "drug") n.rot += n.spin;
        n.x = Math.max(n.rad + 44, Math.min(W - n.rad - 44, n.x));
        n.y = Math.max(n.rad + 12, Math.min(H - n.rad - 24, n.y));
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      pulse += 0.006;
      const hov = hoverRef.current;
      const connected = new Set<Node>();
      if (hov) { edges.forEach(e => { if (e.a === hov || e.b === hov) { connected.add(e.a); connected.add(e.b); } }); }

      for (const e of edges) {
        const active = !hov || e.a === hov || e.b === hov;
        const contradiction = e.rel === "contradicts";
        ctx.beginPath();
        const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2 - 12;
        ctx.moveTo(e.a.x, e.a.y);
        ctx.quadraticCurveTo(mx, my, e.b.x, e.b.y);
        ctx.lineWidth = active ? 1.4 : 0.8;
        if (contradiction) {
          ctx.strokeStyle = active ? "rgba(127,61,46,0.85)" : "rgba(127,61,46,0.3)";
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = active ? "rgba(151,149,94,0.6)" : "rgba(151,149,94,0.18)";
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (!contradiction && active) {
          const p = (pulse + e.a.x * 0.001) % 1;
          const px = (1-p)*(1-p)*e.a.x + 2*(1-p)*p*mx + p*p*e.b.x;
          const py = (1-p)*(1-p)*e.a.y + 2*(1-p)*p*my + p*p*e.b.y;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168,230,163,${hov ? 0.9 : 0.5})`;
          ctx.fill();
        }
      }

      for (const n of nodes) {
        const st = KIND_STYLE[n.kind];
        const dim = !!(hov && n !== hov && !connected.has(n));
        const lit = n === hov || !!(hov && connected.has(n));
        ctx.globalAlpha = dim ? 0.26 : 1;

        if (n.kind === "condition") {
          const gr = n.rad + 6 + Math.sin(pulse * 3 + n.x) * 2;
          ctx.beginPath(); ctx.arc(n.x, n.y, gr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168,230,163,${lit ? 0.6 : 0.24})`; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(n.x, n.y, n.rad, 0, Math.PI * 2);
          ctx.fillStyle = "#2E3D2B"; ctx.fill();
          ctx.strokeStyle = "#A8E6A3"; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(n.x, n.y, n.rad * 0.44, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(168,230,163,0.45)"; ctx.lineWidth = 1; ctx.stroke();
        } else if (n.kind === "drug") {
          drawMolecule(n.x, n.y, n.rad * 0.9, n.rot, lit ? "#A8E6A3" : st.text, n.rings);
        } else {
          drawPathway(n.x, n.y, n.rad, lit);
        }

        ctx.globalAlpha = dim ? 0.26 : 1;
        const isCond = n.kind === "condition";
        ctx.font = (isCond ? "500 11.5px " : "400 10.5px ") + "'IBM Plex Mono', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.shadowColor = "#1A1D14"; ctx.shadowBlur = 7;
        ctx.fillStyle = isCond ? "#F4EFE6" : (lit ? "#A8E6A3" : st.text);
        ctx.fillText(n.label, n.x, n.y + n.rad + 6);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    function loop() { step(); draw(); rafRef.current = requestAnimationFrame(loop); }
    loop();

    function onMove(ev: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      let found: Node | null = null;
      for (const n of nodes) {
        const dx = mx - n.x, dy = my - n.y;
        if (dx * dx + dy * dy < (n.rad + 6) * (n.rad + 6)) { found = n; break; }
      }
      hoverRef.current = found;
      canvas!.style.cursor = found ? "pointer" : "default";
    }
    function onLeave() { hoverRef.current = null; }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [height]);

  return (
    <div className="graph-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
