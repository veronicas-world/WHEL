"use client";

import { useRef, useEffect } from "react";

export default function CyclicalPK({ height = 300 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let Wd = wrap.clientWidth, Hd = height;
    const padL = 16, padR = 16, padT = 26, padB = 34;

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
    const E = (d: number) => 0.16 + 0.74 * gauss(d, 13, 2.3) + 0.34 * gauss(d, 21, 4.2);
    const P = (d: number) => 0.05 + 0.92 * gauss(d, 22, 4.0);
    const DAYS = 28;
    const X = (d: number) => padL + (d / DAYS) * (Wd - padL - padR);
    const Y = (v: number) => padT + (1 - v) * (Hd - padT - padB);

    let marker = 0;

    function curve(fn: (d: number) => number, color: string, w: number) {
      ctx.beginPath();
      for (let d = 0; d <= DAYS; d += 0.5) {
        const x = X(d), y = Y(fn(d));
        d ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    }

    function frame() {
      ctx.clearRect(0, 0, Wd, Hd);
      const wx0 = X(14), wx1 = X(28);
      ctx.fillStyle = "rgba(168,230,163,0.10)";
      ctx.fillRect(wx0, padT, wx1 - wx0, Hd - padT - padB);
      ctx.strokeStyle = "rgba(168,230,163,0.35)"; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(wx0, padT); ctx.lineTo(wx0, Hd - padB); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(244,239,230,0.14)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, Hd - padB); ctx.lineTo(Wd - padR, Hd - padB); ctx.stroke();
      curve(E, "#A8E6A3", 2);
      curve(P, "#C9B26B", 2);
      marker += 0.06; if (marker > DAYS) marker = 0;
      const mx = X(marker);
      ctx.strokeStyle = "rgba(244,239,230,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, padT - 6); ctx.lineTo(mx, Hd - padB); ctx.stroke();
      ([["#A8E6A3", E] as const, ["#C9B26B", P] as const]).forEach(([c, fn]) => {
        ctx.beginPath(); ctx.arc(mx, Y(fn(marker)), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.fill();
        ctx.strokeStyle = "#100C0E"; ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.fillStyle = "#F4EFE6";
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.textAlign = mx > Wd - 70 ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillText("DAY " + String(Math.round(marker)).padStart(2, "0"), mx + (mx > Wd - 70 ? -8 : 8), padT - 4);
      ctx.fillStyle = "rgba(244,239,230,0.45)";
      ctx.font = "400 9.5px 'IBM Plex Mono', monospace";
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
      ctx.fillText("FOLLICULAR", X(6), Hd - 12);
      ctx.fillText("OVULATION", X(13.5), Hd - 12);
      ctx.fillText("LUTEAL", X(22), Hd - 12);
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
      <div style={{ display: "flex", gap: 20, padding: "10px 18px 16px", flexWrap: "wrap" }} className="graph-legend">
        <span className="lg"><span className="sw" style={{ background: "#A8E6A3" }} />Estrogen</span>
        <span className="lg"><span className="sw" style={{ background: "#C9B26B" }} />Progesterone</span>
        <span className="lg">
          <span className="sw" style={{ background: "rgba(168,230,163,0.25)", border: "1px dashed rgba(168,230,163,0.5)" }} />
          Luteal dosing window
        </span>
      </div>
    </div>
  );
}
