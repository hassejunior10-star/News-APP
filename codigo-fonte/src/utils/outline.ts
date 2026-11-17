import { FONT_DATA } from '../data/glyphs';

export type FontKey = keyof typeof FONT_DATA;

type Cmd = { t: string; n: number[] };
const parsed = new Map<string, Cmd[]>();

/** Se a fonte não tiver o caractere, usa "?" em vez de deixar um buraco. */
function resolveChar(font: FontKey, ch: string) {
  const glyphs = FONT_DATA[font].glyphs;
  if (glyphs[ch]) return ch;
  if (glyphs['?']) return '?';
  return ' ';
}

function commands(font: FontKey, ch: string): Cmd[] {
  ch = resolveChar(font, ch);
  const id = `${font}:${ch}`;
  const hit = parsed.get(id);
  if (hit) return hit;

  const glyph = FONT_DATA[font].glyphs[ch];
  const list: Cmd[] = [];
  if (glyph) {
    for (const tok of glyph.c.split(' ')) {
      if (!tok) continue;
      if (/^[MLQCZ]$/.test(tok)) list.push({ t: tok, n: [] });
      else list[list.length - 1].n.push(Number(tok));
    }
  }
  parsed.set(id, list);
  return list;
}

interface Placed {
  ch: string;
  x: number;
  adv: number;
}

function layout(font: FontKey, text: string, size: number, spacing: number) {
  const data = FONT_DATA[font];
  const scale = size / data.upm;
  const chars = [...text];
  const items: Placed[] = [];
  let x = 0;

  chars.forEach((raw, i) => {
    const ch = resolveChar(font, raw);
    const next = i < chars.length - 1 ? resolveChar(font, chars[i + 1]) : '';
    const glyph = data.glyphs[ch];
    const adv = glyph.a * scale;
    items.push({ ch, x, adv });
    x += adv;
    if (i < chars.length - 1) {
      x += (data.kern[ch + next] ?? 0) * scale + spacing;
    }
  });

  return { items, width: x, scale };
}

const f = (n: number) => (Math.round(n * 100) / 100).toString();

function draw(font: FontKey, ch: string, scale: number, map: (x: number, y: number) => [number, number]) {
  let d = '';
  for (const c of commands(font, ch)) {
    d += c.t;
    for (let i = 0; i < c.n.length; i += 2) {
      // Fonte usa eixo Y para cima; SVG usa Y para baixo.
      const [px, py] = map(c.n[i] * scale, -c.n[i + 1] * scale);
      d += `${f(px)} ${f(py)} `;
    }
  }
  return d;
}

/** Largura do texto no tamanho informado. */
export function measure(font: FontKey, text: string, size: number, spacing = 0) {
  return layout(font, text, size, spacing).width;
}

/** Altura das maiúsculas no tamanho informado. */
export function capHeight(font: FontKey, size: number) {
  return (FONT_DATA[font].cap / FONT_DATA[font].upm) * size;
}

/** Tamanho de fonte necessário para o texto ocupar exatamente `width`. */
export function fitSize(font: FontKey, text: string, width: number) {
  return (width / measure(font, text, 1000)) * 1000;
}

interface LineOptions {
  x: number;
  /** Linha de base do texto. */
  y: number;
  anchor?: 'start' | 'middle';
  spacing?: number;
}

/** Texto em linha reta, já convertido em curvas. */
export function lineText(font: FontKey, text: string, size: number, o: LineOptions) {
  const { items, width, scale } = layout(font, text, size, o.spacing ?? 0);
  const left = o.anchor === 'start' ? o.x : o.x - width / 2;
  return items.map((it) => draw(font, it.ch, scale, (x, y) => [left + it.x + x, o.y + y])).join('');
}

interface ArcOptions {
  cx: number;
  cy: number;
  /** Raio da linha de base. */
  r: number;
  side: 'top' | 'bottom';
  spacing?: number;
}

/** Texto acompanhando um círculo (em cima ou embaixo), convertido em curvas. */
export function arcText(font: FontKey, text: string, size: number, o: ArcOptions) {
  const { items, width, scale } = layout(font, text, size, o.spacing ?? 0);
  return items
    .map((it) => {
      const mid = it.x + it.adv / 2 - width / 2;
      const phi = mid / o.r;
      const rot = o.side === 'top' ? phi : -phi;
      const ox = o.cx + o.r * Math.sin(phi);
      const oy = o.side === 'top' ? o.cy - o.r * Math.cos(phi) : o.cy + o.r * Math.cos(phi);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      return draw(font, it.ch, scale, (x, y) => {
        const lx = x - it.adv / 2;
        return [ox + lx * cos - y * sin, oy + lx * sin + y * cos];
      });
    })
    .join('');
}
