"use client";

import { useRef, useEffect } from "react";

/* Hormone palette — kept within the brand's ink/moss/gold family.
   Estradiol + progesterone lead (they drive the luteal dosing window);
   LH + FSH are the supporting machinery that show the cycle's complexity. */
const C = {
  estradiol:    "#A8E6A3", // signal green
  progesterone: "#C9B26B", // gold
  lh:           "#79B9AE", // soft teal
  fsh:          "#C98A5C", // clay
  bone:         "#F4EFE6",
  muted:        "rgba(244,239,230,0.45)",
  baseline:     "rgba(244,239,230,0.14)",
};

export default function CyclicalPK({ height = 340 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let Wd = wrap.clientWidth;
    const Hd = height;
    const padL = 34, padR = 18, padT = 26, padB = 52;
    const DAYS = 28;

    function resize() {
      Wd = wrap!.clientWidth;
      cv!.width = Wd * DPR; cv!.height = Hd * DPR;
      cv!.style.height = Hd + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const gauss = (d: number, mu: number, sig: number) =>
      Math.exp(-((d - mu) * (d - mu)) / (2 * sig * sig));
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    // Normalised hormone trajectories across a 28-day cycle (0..1).
    const E   = (d: number) => clamp01(0.14 + 0.70 * gauss(d, 12.8, 2.1) + 0.33 * gauss(d, 21, 4.0));
    const P   = (d: number) => clamp01(0.05 + 0.90 * gauss(d, 21.5, 3.6));
    const LH  = (d: number) => clamp01(0.09 + 0.86 * gauss(d, 13.3, 0.8));
    const FSH = (d: number) =>
      clamp01(0.20 + 0.34 * gauss(d, 4.5, 3.0) + 0.30 * gauss(d, 13.1, 1.0) + 0.20 * gauss(d, 28.6, 2.6));

    const HORMONES: { fn: (d: number) => number; color: string; w: number; alpha: number }[] = [
      { fn: FSH, color: C.fsh,          w: 1.6, alpha: 0.85 },
      { fn: LH,  color: C.lh,           w: 1.6, alpha: 0.85 },
      { fn: E,   color: C.estradiol,    w: 2.3, alpha: 1 },
      { fn: P,   color: C.progesterone, w: 2.3, alpha: 1 },
    ];

    const PHASES: { from: number; to: number; label: string; fill: string }[] = [
      { from: 0,  to: 5,  label: "MENSTRUATION", fill: "rgba(160,70,55,0.30)" },
      { from: 5,  to: 13, label: "FOLLICULAR",   fill: "rgba(168,230,163,0.10)" },
      { from: 13, to: 15, label: "OVULATION",    fill: "rgba(168,230,163,0.24)" },
      { from: 15, to: 28, label: "LUTEAL",       fill: "rgba(201,178,107,0.12)" },
    ];

    let marker = 0;

    function frame() {
      ctx.clearRect(0, 0, Wd, Hd);
      const plotL = padL, plotR = Wd - padR, plotT = padT, plotB = Hd - padB;
      const X = (d: number) => plotL + (d / DAYS) * (plotR - plotL);
      const Y = (v: number) => plotT + (1 - v) * (plotB - plotT);

      // Luteal dosing window (Whel-specific overlay): day 14 to 28.
      const wx0 = X(14), wx1 = X(28);
      ctx.fillStyle = "rgba(168,230,163,0.07)";
      ctx.fillRect(wx0, plotT, wx1 - wx0, plotB - plotT);
      ctx.strokeStyle = "rgba(168,230,163,0.35)"; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(wx0, plotT); ctx.lineTo(wx0, plotB); ctx.stroke();
      ctx.setLineDash([]);

      // Baseline
      ctx.strokeStyle = C.baseline; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plotL, plotB); ctx.lineTo(plotR, plotB); ctx.stroke();

      // Hormone curves
      for (const h of HORMONES) {
        ctx.globalAlpha = h.alpha;
        ctx.beginPath();
        for (let d = 0; d <= DAYS; d += 0.4) {
          const x = X(d), y = Y(h.fn(d));
          if (d) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = h.color; ctx.lineWidth = h.w; ctx.lineJoin = "round";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Animated sweep marker + dots on each curve
      marker += 0.05; if (marker > DAYS) marker = 0;
      const mx = X(marker);
      ctx.strokeStyle = "rgba(244,239,230,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, plotT - 6); ctx.lineTo(mx, plotB); ctx.stroke();
      for (const h of HORMONES) {
        ctx.beginPath(); ctx.arc(mx, Y(h.fn(marker)), 3.2, 0, Math.PI * 2);
        ctx.fillStyle = h.color; ctx.fill();
        ctx.strokeStyle = "#100C0E"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.fillStyle = C.bone;
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.textAlign = mx > Wd - 72 ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillText("DAY " + String(Math.round(marker)).padStart(2, "0"), mx + (mx > Wd - 72 ? -8 : 8), plotT - 4);

      // Phase strip
      const bandTop = plotB + 8, bandH = 13;
      ctx.font = "500 8.5px 'IBM Plex Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const ph of PHASES) {
        const x0 = X(ph.from), x1 = X(ph.to);
        ctx.fillStyle = ph.fill;
        ctx.fillRect(x0, bandTop, x1 - x0, bandH);
        if (x1 - x0 > 46) {
          ctx.fillStyle = "rgba(244,239,230,0.72)";
          ctx.fillText(ph.label, (x0 + x1) / 2, bandTop + bandH / 2 + 0.5);
        }
      }

      // Day axis
      ctx.fillStyle = C.muted;
      ctx.font = "400 9px 'IBM Plex Mono', monospace";
      ctx.textBaseline = "alphabetic";
      [0, 7, 14, 21, 28].forEach((d) => {
        ctx.textAlign = d === 0 ? "left" : d === 28 ? "right" : "center";
        ctx.fillText("DAY " + d, X(d), Hd - 8);
      });

      // Y-axis label
      ctx.save();
      ctx.translate(11, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = C.muted;
      ctx.font = "400 9px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HORMONE LEVEL", 0, 0);
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [height]);

  return (
    <div style={{ background: "var(--ink)", border: "1px solid var(--ink-line)" }}>
      <div ref={wrapRef} style={{ position: "relative", padding: "14px 18px 4px" }}>
        <canvas ref={cvRef} style={{ display: "block", width: "100%" }} />
      </div>
      <div style={{ display: "flex", gap: 18, padding: "10px 18px 16px", flexWrap: "wrap" }} className="graph-legend">
        <span className="lg"><span className="sw" style={{ background: C.estradiol }} />Estradiol</span>
        <span className="lg"><span className="sw" style={{ background: C.progesterone }} />Progesterone</span>
        <span className="lg"><span className="sw" style={{ background: C.lh }} />LH</span>
        <span className="lg"><span className="sw" style={{ background: C.fsh }} />FSH</span>
        <span className="lg">
          <span className="sw" style={{ background: "rgba(168,230,163,0.22)", border: "1px dashed rgba(168,230,163,0.5)" }} />
          Luteal dosing window
        </span>
      </div>
    </div>
  );
}
