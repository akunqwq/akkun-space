"use client";

import { useEffect, useRef, useState } from "react";
import quotes from "@/data/site/quotes.json";

function cleanText(str: string) {
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[\uFFF0-\uFFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitGraphemes(str: string) {
  return Array.from(str.normalize("NFC"));
}

export default function FooterQuote() {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef<number | null>(null);
  const rotationRef = useRef<number | null>(null);

  useEffect(() => {
    let currentIndex = Math.floor(Math.random() * quotes.length);

    function typeQuote(index: number) {
      const text = cleanText(quotes[index]);
      setDisplayed("");
      setIsTyping(true);
      const chars = splitGraphemes(text);
      let i = 0;

      typingRef.current = window.setInterval(() => {
        if (i >= chars.length) {
          if (typingRef.current) clearInterval(typingRef.current);
          setIsTyping(false);
          return;
        }
        const c = chars[i];
        if (!c) {
          i++;
          return;
        }
        setDisplayed((prev) => prev + c);
        i++;
      }, 40);
    }

    typeQuote(currentIndex);

    // 每 6 秒轮换一条名言（避免与上一句重复）
    rotationRef.current = window.setInterval(() => {
      let next;
      do {
        next = Math.floor(Math.random() * quotes.length);
      } while (next === currentIndex && quotes.length > 1);
      currentIndex = next;
      if (typingRef.current) clearInterval(typingRef.current);
      typeQuote(currentIndex);
    }, 6000);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, []);

  return (
    <p className="text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)] truncate px-4">
      “{displayed}”{isTyping && <span className="animate-pulse">|</span>}
    </p>
  );
}
