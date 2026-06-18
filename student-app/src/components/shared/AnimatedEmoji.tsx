'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';
import { getNotoLottieUrl } from '@/lib/notoEmoji';

const lottieCache = new Map<string, object>();

export default function AnimatedEmoji({ emoji, size = 64, loop = true, className }: { emoji: string; size?: number; loop?: boolean; className?: string }) {
  const [data, setData] = useState<object | null>(lottieCache.get(emoji) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (data || failed) return;
    fetch(getNotoLottieUrl(emoji))
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then((json: object) => { lottieCache.set(emoji, json); setData(json); })
      .catch(() => setFailed(true));
  }, [emoji]);

  if (failed) return <span style={{ fontSize: size * 0.75 }}>{emoji}</span>;
  if (!data) return <span style={{ width: size, height: size, display: 'inline-block', borderRadius: '50%', background: 'rgba(128,128,128,0.1)' }} />;

  return <Lottie animationData={data} loop={loop} className={className} style={{ width: size, height: size }} />;
}
