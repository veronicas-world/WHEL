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
  const [text, setText] = useState(FULL_TEXT);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Only animate on the first visit per browser session
    if (sessionStorage.getItem("whel-intro-done")) return;

    setText("");
    setTyping(true);

    let i = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      i++;
      setText(FULL_TEXT.slice(0, i));
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
    <h1 className={className} style={style}>
      {text}
      {typing && (
        <span className="type-cursor" aria-hidden="true" />
      )}
    </h1>
  );
}
