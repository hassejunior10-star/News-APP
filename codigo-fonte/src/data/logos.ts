import { LogoItem, LogoVariant } from '../types';
import { arcText, capHeight, fitSize, lineText, measure } from '../utils/outline';
import { SAMPLE_PHOTO } from './samplePhoto';

/** Vermelho do logotipo original. */
export const BRAND_RED = '#FF0000';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

const open = (w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

const backdrop = (variant: LogoVariant, w: number, h: number) =>
  variant === 'red'
    ? `<rect width="${w}" height="${h}" fill="${BRAND_RED}"/>`
    : variant === 'dark'
    ? `<rect width="${w}" height="${h}" fill="#111111"/>`
    : '';

/** Letra branca com contorno preto, como no logotipo original. */
const outlined = (d: string, strokeWidth: number, fill = WHITE) =>
  `<path d="${d}" fill="${BLACK}" stroke="${BLACK}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="${fill}"/>`;

/* ---------- 1. Monograma VN ---------- */
function monogram(): LogoItem {
  const S = 1000;
  const size = fitSize('slab', 'VN', 720);
  const cap = capHeight('slab', size);
  const d = lineText('slab', 'VN', size, { x: S / 2, y: S / 2 + cap / 2 });

  return {
    id: 'vn-monogram-classic',
    fileName: 'vn-monograma',
    name: 'VN Monograma',
    category: 'monogram',
    description:
      'As letras VN no mesmo estilo do logotipo: brancas, com contorno preto. É a versão principal para colocar sobre fotos e usar como foto de perfil.',
    recommendedFor: ['Marca nas fotos', 'Foto de perfil', 'Stories e Reels'],
    width: S,
    height: S,
    previewVariant: 'red',
    getSvgString: (v) => `${open(S, S)}${backdrop(v, S, S)}${outlined(d, 40)}</svg>`,
  };
}

/* ---------- 2. Marca d'água VN + nome ---------- */
function watermark(): LogoItem {
  const W = 1000;
  const inner = 520;
  const s1 = fitSize('slab', 'VN', inner);
  const cap1 = capHeight('slab', s1);
  const base1 = 70 + cap1;
  const barY = base1 + 52;
  const s2 = fitSize('sans', 'VACARIA NEWS', inner);
  const cap2 = capHeight('sans', s2);
  const base2 = barY + 16 + 44 + cap2;
  const H = Math.round(base2 + 70);

  const vn = lineText('slab', 'VN', s1, { x: W / 2, y: base1 });
  const name = lineText('sans', 'VACARIA NEWS', s2, { x: W / 2, y: base2 });
  // No fundo vermelho a barra vira branca, senão some.
  const bar = (v: LogoVariant) =>
    `<rect x="${(W - inner) / 2}" y="${barY}" width="${inner}" height="16" rx="8" fill="${v === 'red' ? WHITE : BRAND_RED}" stroke="${BLACK}" stroke-width="5"/>`;

  return {
    id: 'vn-watermark-overlay',
    fileName: 'vn-marca-dagua',
    name: "VN Marca d'Água com Nome",
    category: 'watermark',
    description:
      'VN com o nome VACARIA NEWS embaixo. O contorno preto mantém a marca legível em fotos claras e escuras.',
    recommendedFor: ['Fotos de reportagem', 'Vídeos', 'Stories'],
    width: W,
    height: H,
    previewVariant: 'transparent',
    getSvgString: (v) =>
      `${open(W, H)}${backdrop(v, W, H)}${outlined(vn, 30)}${bar(v)}${outlined(name, 14)}</svg>`,
  };
}

/* ---------- 3. Selo circular ---------- */
function badge(): LogoItem {
  const S = 1000;
  const c = S / 2;
  const textSize = 84;
  const capT = capHeight('sans', textSize);
  const band = 372;
  const top = arcText('sans', 'VACARIA', textSize, { cx: c, cy: c, r: band - capT / 2, side: 'top', spacing: 12 });
  const bottom = arcText('sans', 'NEWS', textSize, { cx: c, cy: c, r: band + capT / 2, side: 'bottom', spacing: 12 });

  const sVn = fitSize('slab', 'VN', 380);
  const vn = lineText('slab', 'VN', sVn, { x: c, y: c + capHeight('slab', sVn) / 2 });
  const dot = (x: number) =>
    `<circle cx="${x}" cy="${c}" r="11" fill="${WHITE}" stroke="${BLACK}" stroke-width="5"/>`;

  const art =
    `<circle cx="${c}" cy="${c}" r="470" fill="${BRAND_RED}" stroke="${BLACK}" stroke-width="20"/>` +
    `<circle cx="${c}" cy="${c}" r="446" fill="none" stroke="${WHITE}" stroke-width="6"/>` +
    `<circle cx="${c}" cy="${c}" r="300" fill="${BLACK}" stroke="${WHITE}" stroke-width="8"/>` +
    outlined(top, 10) +
    outlined(bottom, 10) +
    dot(c - band) +
    dot(c + band) +
    `<path d="${vn}" fill="${WHITE}"/>`;

  return {
    id: 'vn-badge-stamp',
    fileName: 'vn-selo',
    name: 'VN Selo Circular',
    category: 'badge',
    description:
      'Selo redondo com VN no centro e o nome em volta. Funciona bem no canto da foto ou como adesivo.',
    recommendedFor: ['Canto da foto', 'Adesivo', 'Carimbo'],
    width: S,
    height: S,
    previewVariant: 'transparent',
    getSvgString: (v) => `${open(S, S)}${backdrop(v, S, S)}${art}</svg>`,
  };
}

/* ---------- 4. Horizontal: caixa VN + nome ---------- */
function horizontal(): LogoItem {
  const H = 440;
  const box = 360;
  const textH = 340;
  const kV = capHeight('slab', 1000) / measure('slab', 'VACARIA', 1000);
  const kN = capHeight('slab', 1000) / measure('slab', 'NEWS', 1000);
  const textW = textH / (kV + kN + 0.05);
  const sV = fitSize('slab', 'VACARIA', textW);
  const sN = fitSize('slab', 'NEWS', textW);
  const left = 40 + box + 62;
  const W = Math.round(left + textW + 52);
  const topY = (H - textH) / 2;

  const sVn = fitSize('slab', 'VN', 250);
  const vn = lineText('slab', 'VN', sVn, { x: 40 + box / 2, y: H / 2 + capHeight('slab', sVn) / 2 });
  const l1 = lineText('slab', 'VACARIA', sV, { x: left, y: topY + capHeight('slab', sV), anchor: 'start' });
  const l2 = lineText('slab', 'NEWS', sN, { x: left, y: topY + textH, anchor: 'start' });

  const art =
    `<rect x="40" y="40" width="${box}" height="${box}" rx="28" fill="${BRAND_RED}" stroke="${BLACK}" stroke-width="14"/>` +
    outlined(vn, 18) +
    outlined(l1, 12) +
    outlined(l2, 12);

  return {
    id: 'vn-horizontal-full',
    fileName: 'vn-horizontal',
    name: 'VN Horizontal com Nome',
    category: 'horizontal',
    description:
      'Caixa vermelha com VN ao lado do nome VACARIA NEWS. Para cabeçalho de site, capa e assinatura.',
    recommendedFor: ['Cabeçalho do site', 'Capa de matéria', 'Assinatura'],
    width: W,
    height: H,
    previewVariant: 'transparent',
    getSvgString: (v) => `${open(W, H)}${backdrop(v, W, H)}${art}</svg>`,
  };
}

/* ---------- 5. Tarja URGENTE ---------- */
function breaking(): LogoItem {
  const H = 240;
  const nameSize = 58;
  const nameW = measure('sans', 'VACARIA NEWS', nameSize, 4);
  const W = Math.round(330 + nameW + 60);

  const sVn = fitSize('slab', 'VN', 170);
  const vn = lineText('slab', 'VN', sVn, { x: 148, y: H / 2 + capHeight('slab', sVn) / 2 });
  const tagSize = 30;
  const tagW = measure('sans', 'URGENTE', tagSize, 3);
  const tag = lineText('sans', 'URGENTE', tagSize, {
    x: 350,
    y: 82 + capHeight('sans', tagSize) / 2,
    anchor: 'start',
    spacing: 3,
  });
  const name = lineText('sans', 'VACARIA NEWS', nameSize, { x: 330, y: 184, anchor: 'start', spacing: 4 });

  const art =
    `<rect x="10" y="30" width="${W - 20}" height="180" rx="16" fill="#111111" stroke="${BLACK}" stroke-width="6"/>` +
    `<path d="M26 30H300L262 210H26A16 16 0 0 1 10 194V46A16 16 0 0 1 26 30Z" fill="${BRAND_RED}"/>` +
    outlined(vn, 14) +
    `<rect x="330" y="58" width="${Math.round(tagW + 40)}" height="48" rx="6" fill="${BRAND_RED}"/>` +
    `<path d="${tag}" fill="${WHITE}"/>` +
    `<path d="${name}" fill="${WHITE}"/>`;

  return {
    id: 'vn-breaking-news-bar',
    fileName: 'vn-tarja-urgente',
    name: 'VN Tarja Urgente',
    category: 'breaking',
    description: 'Tarja preta com VN e a etiqueta URGENTE, para o rodapé ou o topo de fotos de última hora.',
    recommendedFor: ['Notícia urgente', 'Rodapé da foto'],
    width: W,
    height: H,
    previewVariant: 'transparent',
    getSvgString: (v) => `${open(W, H)}${backdrop(v, W, H)}${art}</svg>`,
  };
}

/* ---------- 6. Logotipo completo ---------- */
function original(): LogoItem {
  const S = 1000;
  const width = 880;
  const sV = fitSize('slab', 'VACARIA', width);
  const sN = fitSize('slab', 'NEWS', width);
  const capV = capHeight('slab', sV);
  const capN = capHeight('slab', sN);
  const gap = 62;
  const top = (S - (capV + gap + capN)) / 2;

  const l1 = lineText('slab', 'VACARIA', sV, { x: S / 2, y: top + capV });
  const l2 = lineText('slab', 'NEWS', sN, { x: S / 2, y: top + capV + gap + capN });

  return {
    id: 'vn-original-restored',
    fileName: 'vacaria-news-completo',
    name: 'VACARIA NEWS Completo',
    category: 'original',
    description:
      'O logotipo completo redesenhado em vetor, para ampliar sem perder nitidez. A letra é muito parecida com a original, mas não é idêntica.',
    recommendedFor: ['Uso institucional', 'Banner', 'Impressão'],
    width: S,
    height: S,
    previewVariant: 'red',
    getSvgString: (v) => `${open(S, S)}${backdrop(v, S, S)}${outlined(l1, 24)}${outlined(l2, 24)}</svg>`,
  };
}

export const LOGO_ITEMS: LogoItem[] = [monogram(), watermark(), badge(), horizontal(), breaking(), original()];

/** Fotos de banco de imagens, só para testar a marca d'água. */
export const SAMPLE_NEWS_PHOTOS = [
  {
    id: 'chuva',
    title: 'Exemplo: rua em dia de chuva',
    url: SAMPLE_PHOTO,
    tag: 'CHUVA',
  },
  {
    id: 'estrada',
    title: 'Exemplo: estrada',
    url: 'https://images.pexels.com/photos/28840460/pexels-photo-28840460.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1200',
    tag: 'ESTRADA',
  },
  {
    id: 'rua',
    title: 'Exemplo: rua de dia',
    url: 'https://images.pexels.com/photos/9364799/pexels-photo-9364799.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1200',
    tag: 'RUA',
  },
  {
    id: 'neve',
    title: 'Exemplo: paisagem clara',
    url: 'https://images.pexels.com/photos/11506984/pexels-photo-11506984.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1200',
    tag: 'CLARA',
  },
];
