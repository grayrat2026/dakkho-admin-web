export function emojiToNotoCode(emoji: string): string {
  return [...emoji]
    .map(char => char.codePointAt(0)!)
    .filter(cp => cp !== 0xFE0F && cp !== 0xFE0E)
    .map(cp => cp.toString(16).toLowerCase())
    .join('_');
}

export const getNotoGifUrl = (emoji: string): string => {
  const code = emojiToNotoCode(emoji);
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.gif`;
};

export const getNotoLottieUrl = (emoji: string): string => {
  const code = emojiToNotoCode(emoji);
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/lottie.json`;
};

export type TextPart = { type: 'text'; value: string } | { type: 'emoji'; value: string };

export function splitByEmoji(text: string): TextPart[] {
  const EMOJI_REGEX = /\p{RGI_Emoji}/gu;
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = EMOJI_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'emoji', value: match[0] });
    lastIndex = EMOJI_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}
