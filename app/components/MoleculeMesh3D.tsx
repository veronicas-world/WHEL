"use client";

import { useRef, useEffect } from "react";

export interface Marker {
  abbr: string;
  cond: string;
  id: string;
  contradiction?: boolean;
}

interface Props {
  height?: number;
  markers?: Marker[];
  spin?: number;
  arms?: number;
  detail?: "high" | "med" | "low";
  baseR?: number;
  amp?: number;
  exp?: number;
  fill?: number;
  palette?: "dark" | "light";
  cyf?: number;
  interactive?: boolean;
  extraArms?: boolean;
}

export default function MoleculeMesh3D({
  height = 480,
  markers = [],
  spin = 0.0022,
  arms = 8,
  detail = "high",
  baseR = 0.42,
  amp = 2.7,
  exp = 5,
  fill = 0.082,
  palette = "dark",
  cyf = 0.5,
  interactive = true,
  extraArms = true,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv   = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let Wd = wrap.clientWidth, Hd = height;

    // ── Radial lobe directions (the fingers) ────────────────────────────────
    const lobeSet: Array<{ d: number[]; w: number }> = [];
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2;
      lobeSet.push({ d: [Math.cos(a), 0, Math.sin(a)], w: 1 });
    }
    if (extraArms) {
      [[0.72, 0.42, 0.55], [-0.62, 0.38, -0.6], [0.24, 0.6, 0.32], [-0.2, -0.5, 0.78]].forEach(
        (d) => lobeSet.push({ d, w: 0.6 }),
      );
    }
    lobeSet.forEach((L) => {
      const m = Math.hypot(L.d[0], L.d[1], L.d[2]);
      L.d[0] /= m; L.d[1] /= m; L.d[2] /= m;
    });
    const lobes = lobeSet.filter((L) => L.w === 1).map((L) => L.d);

    const radial = (x: number, y: number, z: number) => {
      let r = baseR;
      for (const L of lobeSet) {
        const d = x * L.d[0] + y * L.d[1] + z * L.d[2];
        if (d > 0) r += amp * L.w * Math.pow(d, exp);
      }
      return r;
    };

    // ── UV-sphere geometry, displaced by radial lobe function ────────────────
    const RES: Record<string, number[]> = { high: [40, 54], med: [30, 40], low: [20, 28] };
    const [S, Ln] = RES[detail] ?? [36, 48];
    const verts: number[][] = [];
    for (let s = 0; s <= S; s++) {
      const theta = (s / S) * Math.PI;
      for (let l = 0; l < Ln; l++) {
        const phi = (l / Ln) * Math.PI * 2;
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.cos(theta);
        const z = Math.sin(theta) * Math.sin(phi);
        const rr = radial(x, y, z);
        verts.push([x * rr, y * rr, z * rr]);
      }
    }
    const vidx = (s: number, l: number) => s * Ln + (l % Ln);
    const edges: [number, number][] = [];
    for (let s = 0; s <= S; s++) {
      for (let l = 0; l < Ln; l++) {
        edges.push([vidx(s, l), vidx(s, l + 1)]);
        if (s < S) edges.push([vidx(s, l), vidx(s + 1, l)]);
      }
    }
    const markerDirs: number[][] = lobes.map((L) => {
      const rr = radial(L[0], L[1], L[2]);
      return [L[0] * rr, L[1] * rr, L[2] * rr];
    });
    const maxExtent = baseR + amp * 1.2;

    function resize(): boolean {
      const w = wrap!.clientWidth;
      if (!w) return false;
      Wd = w; Hd = height;
      cv!.width  = Wd * DPR; cv!.height = Hd * DPR;
      cv!.style.height = Hd + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return true;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Pause render loop when scrolled offscreen
    let visible = true;
    const io = new IntersectionObserver(
      (es) => { visible = es[0].isIntersecting; },
      { threshold: 0 },
    );
    io.observe(wrap);

    // ── Rotation state + drag ────────────────────────────────────────────────
    let ay = 0.5, ax = -0.5;
    let dragging = false, sx0 = 0, sy0 = 0, ay0 = 0, ax0 = 0, vY = 0;
    const projAll = new Float32Array(verts.length * 3);

    function rotate(v: number[], cay: number, say: number, cax: number, sax: number): number[] {
      const X  = v[0] * cay - v[2] * say;
      const Z  = v[0] * say + v[2] * cay;
      const Y  = v[1];
      const Y2 = Y * cax - Z * sax;
      const Z2 = Y * sax + Z * cax;
      return [X, Y2, Z2];
    }

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      if (!visible) return;
      // Self-heal: pick up real width once layout settles
      const w = wrap!.clientWidth;
      if (w && cv!.width !== Math.round(w * DPR)) { if (!resize()) return; }
      if (!cv!.width) return;
      ctx.clearRect(0, 0, Wd, Hd);

      if (!dragging) { ay += spin + vY; vY *= 0.94; }
      const cay = Math.cos(ay), say = Math.sin(ay);
      const cax = Math.cos(ax), sax = Math.sin(ax);
      const scale = Math.min(Wd, Hd) * fill;
      const cx = Wd / 2, cy = Hd * cyf;

      for (let i = 0; i < verts.length; i++) {
        const r = rotate(verts[i], cay, say, cax, sax);
        const persp = 6.4 / (6.4 - r[2]);
        projAll[i * 3]     = cx + r[0] * scale * persp;
        projAll[i * 3 + 1] = cy + r[1] * scale * persp;
        projAll[i * 3 + 2] = r[2];
      }

      // Depth-bucketed edge paths
      const NB = 7;
      const paths = Array.from({ length: NB }, () => new Path2D());
      const zRange = maxExtent * 2.2;
      for (let e = 0; e < edges.length; e++) {
        const a = edges[e][0], b = edges[e][1];
        const zAvg = (projAll[a * 3 + 2] + projAll[b * 3 + 2]) * 0.5;
        let zN = (zAvg + zRange * 0.5) / zRange;
        if (zN < 0) zN = 0; if (zN > 1) zN = 1;
        const bk = Math.min(NB - 1, Math.floor(zN * NB));
        paths[bk].moveTo(projAll[a * 3], projAll[a * 3 + 1]);
        paths[bk].lineTo(projAll[b * 3], projAll[b * 3 + 1]);
      }
      const light = palette === "light";
      for (let bk = 0; bk < NB; bk++) {
        const f = bk / (NB - 1);
        let R: number, Gc: number, B: number, alpha: number;
        if (light) {
          R = 26; Gc = 29; B = 20; alpha = 0.04 + f * f * 0.30;
        } else {
          alpha = 0.05 + f * f * 0.42;
          R  = Math.round(151 + (203 - 151) * f);
          Gc = Math.round(149 + (208 - 149) * f);
          B  = Math.round(94  + (190 - 94)  * f);
        }
        ctx.strokeStyle = `rgba(${R},${Gc},${B},${alpha})`;
        ctx.lineWidth   = 0.55 + f * 0.6;
        ctx.stroke(paths[bk]);
      }

      // Annotated markers pinned to arm tips
      const placed: Array<{ sx: number; sy: number; front: boolean; m?: Marker }> = [];
      for (let i = 0; i < markerDirs.length; i++) {
        const r = rotate(markerDirs[i], cay, say, cax, sax);
        const persp = 6.4 / (6.4 - r[2]);
        placed.push({
          sx: cx + r[0] * scale * persp,
          sy: cy + r[1] * scale * persp,
          front: r[2] > -0.4,
          m: markers[i],
        });
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < placed.length; i++) {
        const a = placed[i], b = placed[(i + 1) % placed.length];
        if (!a.front || !b.front || !a.m || !b.m) continue;
        ctx.strokeStyle = "rgba(168,230,163,0.22)";
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      }
      for (const pm of placed) {
        if (!pm.m || !pm.front) continue;
        const col = pm.m.contradiction ? "#C77A63" : "#A8E6A3";
        const o = 7;
        ctx.strokeStyle = col; ctx.lineWidth = 1.2;
        ctx.strokeRect(pm.sx - o, pm.sy - o, o * 2, o * 2);
        ctx.fillStyle = col;
        ctx.fillRect(pm.sx - 2.4, pm.sy - 2.4, 4.8, 4.8);
        const right = pm.sx < Wd * 0.6;
        ctx.textAlign    = right ? "left" : "right";
        ctx.textBaseline = "middle";
        const lx = pm.sx + (right ? o + 8 : -o - 8);
        ctx.shadowColor = "#0C0A0B"; ctx.shadowBlur = 8;
        ctx.font      = "500 12px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "#F4EFE6";
        ctx.fillText(`${pm.m.abbr} → ${pm.m.cond}`, lx, pm.sy - 6);
        ctx.font      = "400 10px 'IBM Plex Mono', monospace";
        ctx.fillStyle = col;
        ctx.fillText(`[ ${pm.m.id} ]`, lx, pm.sy + 8);
        ctx.shadowBlur = 0;
      }
    }
    frame();

    // ── Drag-to-orbit ────────────────────────────────────────────────────────
    function downMouse(ev: MouseEvent) {
      dragging = true; vY = 0;
      sx0 = ev.clientX; sy0 = ev.clientY; ay0 = ay; ax0 = ax;
      cv!.style.cursor = "grabbing";
    }
    function downTouch(ev: TouchEvent) {
      dragging = true; vY = 0;
      sx0 = ev.touches[0].clientX; sy0 = ev.touches[0].clientY; ay0 = ay; ax0 = ax;
    }
    function moveMouse(ev: MouseEvent) {
      if (!dragging) return;
      const dx = ev.clientX - sx0, dy = ev.clientY - sy0;
      ay = ay0 + dx * 0.0095;
      ax = Math.max(-1.35, Math.min(0.55, ax0 + dy * 0.008));
      vY = dx * 0.00002;
    }
    function moveTouch(ev: TouchEvent) {
      if (!dragging) return;
      const dx = ev.touches[0].clientX - sx0, dy = ev.touches[0].clientY - sy0;
      ay = ay0 + dx * 0.0095;
      ax = Math.max(-1.35, Math.min(0.55, ax0 + dy * 0.008));
      vY = dx * 0.00002;
      if (ev.cancelable) ev.preventDefault();
    }
    function up() { dragging = false; cv!.style.cursor = "grab"; }

    if (interactive) {
      cv.addEventListener("mousedown",  downMouse);
      window.addEventListener("mousemove",  moveMouse);
      window.addEventListener("mouseup",    up);
      cv.addEventListener("touchstart", downTouch, { passive: true });
      window.addEventListener("touchmove",  moveTouch, { passive: false });
      window.addEventListener("touchend",   up);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      if (interactive) {
        cv!.removeEventListener("mousedown",  downMouse);
        window.removeEventListener("mousemove",  moveMouse);
        window.removeEventListener("mouseup",    up);
        cv!.removeEventListener("touchstart", downTouch);
        window.removeEventListener("touchmove",  moveTouch);
        window.removeEventListener("touchend",   up);
      }
    };
  }, [height, spin, markers, arms, detail, baseR, amp, exp, fill, palette, cyf, interactive, extraArms]);

  return (
    <div className="graph-wrap" ref={wrapRef}>
      <canvas
        ref={cvRef}
        style={{ display: "block", width: "100%", cursor: interactive ? "grab" : "default" }}
      />
    </div>
  );
}
