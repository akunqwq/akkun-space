'use client';

import { useEffect, useState } from 'react';
import decor from '@/data/site/decor.json';

const EMOJIS: string[] = decor.floatingEmojis;

export default function FloatingEmojis() {
  const [emojis, setEmojis] = useState<Array<{
    id: number;
    emoji: string;
    left: number;
    animationDuration: number;
    animationDelay: number;
    fontSize: number;
  }>>([]);

  useEffect(() => {
    const newEmojis = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 10,
      animationDelay: Math.random() * 10,
      fontSize: 16 + Math.random() * 16,
    }));
    setEmojis(newEmojis);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-fall"
          style={{
            left: `${emoji.left}%`,
            top: '-50px',
            animationDuration: `${emoji.animationDuration}s`,
            animationDelay: `${emoji.animationDelay}s`,
            fontSize: `${emoji.fontSize}px`,
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
}
