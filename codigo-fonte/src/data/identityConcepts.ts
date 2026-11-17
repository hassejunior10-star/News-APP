import { capHeight, lineText, measure, type FontKey } from '../utils/outline';

export type LogoInk = 'white' | 'black';
export type SloganPosition = 'right' | 'below';
export const MAX_SLOGAN_LENGTH = 60;

export interface IdentityConcept {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  svg: (ink: LogoInk) => string;
}

const RED = '#FF0000';
const fillColor = (ink: LogoInk) => ink === 'white' ? '#FFFFFF' : '#111111';
const outlineColor = (ink: LogoInk) => ink === 'white' ? '#000000' : '#FFFFFF';
const svg = (width: number, height: number, artwork: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${artwork}</svg>`;

function lettering(font: FontKey, text: string, size: number, x: number, y: number, ink: LogoInk, strokeWidth: number, spacing = 0) {
  const path = lineText(font, text, size, { x, y, anchor: 'start', spacing });
  return `<path d="${path}" fill="${fillColor(ink)}" stroke="${outlineColor(ink)}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke fill"/>`;
}

function brandLine(size: number, x: number, y: number, ink: LogoInk) {
  const gap = size * 0.38;
  const newsX = x + measure('slab', 'VACARIA', size) + gap;
  return lettering('slab', 'VACARIA', size, x, y, ink, size * 0.075) + lettering('slab', 'NEWS', size, newsX, y, ink, size * 0.075);
}

// Todas as propostas mantêm o mesmo VN em serifa e o contorno da marca enviada.
export const IDENTITY_CONCEPTS: IdentityConcept[] = [
  {
    id: 'vn-original',
    name: 'VN Original',
    description: 'Letras tradicionais, sem fundo',
    width: 700,
    height: 390,
    svg: (ink) => svg(700, 390,
      lettering('slab', 'VN', 300, 55, 265, ink, 22) +
      `<path d="M 60 302 H 162" fill="none" stroke="${RED}" stroke-width="10"/>` +
      brandLine(48, 58, 356, ink)),
  },
  {
    id: 'vn-conexao',
    name: 'VN Conexão',
    description: 'VN original com sinal discreto',
    width: 720,
    height: 390,
    svg: (ink) => svg(720, 390,
      lettering('slab', 'VN', 300, 52, 265, ink, 22) +
      `<path d="M 588 112 Q 638 170 588 228 M 628 88 Q 703 170 628 252" fill="none" stroke="${RED}" stroke-width="15" stroke-linecap="round"/>` +
      brandLine(48, 55, 346, ink)),
  },
  {
    id: 'vacaria-completa',
    name: 'Nome Completo',
    description: 'Vacaria News na fonte original',
    width: 730,
    height: 385,
    svg: (ink) => svg(730, 385,
      lettering('slab', 'VACARIA', 125, 48, 150, ink, 12) +
      lettering('slab', 'NEWS', 175, 48, 314, ink, 15) +
      `<path d="M 52 345 H 160" fill="none" stroke="${RED}" stroke-width="10"/>`),
  },
  {
    id: 'vn-lateral',
    name: 'VN Lateral',
    description: 'Nome da marca ao lado do VN',
    width: 1000,
    height: 270,
    svg: (ink) => svg(1000, 270,
      lettering('slab', 'VN', 230, 45, 215, ink, 18) +
      `<path d="M 475 56 L 475 220" fill="none" stroke="${RED}" stroke-width="12"/>` +
      lettering('slab', 'VACARIA', 74, 520, 130, ink, 7) +
      lettering('slab', 'NEWS', 74, 520, 217, ink, 7)),
  },
];

function wrapSlogan(text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (measure('sans', word, size, 1) > maxWidth) {
      if (current) lines.push(current);
      current = '';
      for (const char of word) {
        if (current && measure('sans', current + char, size, 1) > maxWidth) {
          lines.push(current);
          current = '';
        }
        current += char;
      }
    } else {
      const candidate = current ? `${current} ${word}` : word;
      if (current && measure('sans', candidate, size, 1) > maxWidth) {
        lines.push(current);
        current = word;
      } else current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function sloganLayout(text: string, maxWidth: number) {
  for (let size = 38; size >= 14; size -= 2) {
    const lines = wrapSlogan(text, size, maxWidth);
    if (lines.length <= 3) return { size, lines };
  }
  return { size: 14, lines: wrapSlogan(text, 14, maxWidth).slice(0, 3) };
}

/** A frase só entra no arquivo quando for preenchida; não há fundo no SVG. */
export function composeIdentityLogo(concept: IdentityConcept, ink: LogoInk, slogan: string, position: SloganPosition) {
  const text = slogan.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR').slice(0, MAX_SLOGAN_LENGTH);
  const base = concept.svg(ink);
  if (!text) return { svg: base, width: concept.width, height: concept.height };

  const content = base.slice(base.indexOf('>') + 1, base.lastIndexOf('</svg>'));
  const isRight = position === 'right';
  const maxTextWidth = isRight ? 390 : concept.width - 100;
  const { size, lines } = sloganLayout(text, maxTextWidth);
  const lineHeight = size * 1.28;
  const width = isRight ? concept.width + 470 : concept.width;
  const height = isRight ? concept.height : concept.height + Math.ceil(lines.length * lineHeight + 55);
  const x = isRight ? concept.width + 45 : 52;
  const top = isRight ? (height - lines.length * lineHeight) / 2 : concept.height + 24;
  const line = isRight
    ? `<path d="M ${concept.width + 21} ${top - 6} V ${top + lines.length * lineHeight - 5}" stroke="${RED}" stroke-width="7"/>`
    : `<path d="M 52 ${concept.height + 10} H 150" stroke="${RED}" stroke-width="7"/>`;
  const words = lines.map((item, i) => lettering('sans', item, size, x, top + capHeight('sans', size) + i * lineHeight, ink, 3, 1)).join('');
  return { svg: svg(width, height, content + line + words), width, height };
}