"use client";

import { useEffect, useState } from "react";

const FULL_TEXT = "The drug repurposing platform for female biology.";
const CHAR_DELAY = 38; // ms per character
const START_DELAY = 320; // ms before first character

export default function HeroTitle({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  // Number of characters revealed. The full string is always laid out (the
  // untyped tail is rendered but hidden), so the line wrapping is fixed from
  // the first frame and the text never reflows or jumps as it types.
  const [count, setCount] = useState(FULL_TEXT.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Only animate on the first visit per browser session
    if (sessionStorage.getItem("whel-intro-done")) return;

    setCount(0);
    setTyping(true);

    let i = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      i++;
      setCount(i);
      if (i < FULL_TEXT.length) {
        timerId = setTimeout(tick, CHAR_DELAY);
      } else {
        setTyping(false);
        sessionStorage.setItem("whel-intro-done", "1");
      }
    };

    timerId = setTimeout(tick, START_DELAY);
    return () => clearTimeout(timerId);
  }, []);

  return (
    <h1 className={className} style={style} aria-label={FULL_TEXT}>
      {/* Revealed text. The caret is a border on this span (not a separate
          element), so it introduces no line-break opportunity that could let a
          partial word sit on the line above before the rest types in. */}
      <span aria-hidden="true" className={typing ? "type-caret" : undefined}>
        {FULL_TEXT.slice(0, count)}
      </span>
      {/* Untyped tail: occupies its final space (locking the wrap) but stays invisible */}
      {typing && (
        <span aria-hidden="true" style={{ visibility: "hidden" }}>
          {FULL_TEXT.slice(count)}
        </span>
      )}
    </h1>
  );
}
