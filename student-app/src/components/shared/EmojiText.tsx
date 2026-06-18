'use client';

import { useMemo, useState } from 'react';
import { splitByEmoji, getNotoGifUrl } from '@/lib/notoEmoji';

function InlineEmoji({ emoji, size = '1.3em' }: { emoji: string; size?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span>{emoji}</span>;
  return (
    <img
      src={getNotoGifUrl(emoji)}
      alt={emoji}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
    />
  );
}

export default function EmojiText({ children, emojiSize = '1.3em', className }: { children: string; emojiSize?: string; className?: string }) {
  const parts = useMemo(() => splitByEmoji(String(children ?? '')), [children]);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'emoji'
          ? <InlineEmoji key={i} emoji={part.value} size={emojiSize} />
          : <span key={i}>{part.value}</span>
      )}
    </span>
  );
}
