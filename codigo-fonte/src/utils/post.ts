import { capHeight, fitSize, lineText, measure } from './outline';

export const RED = '#FF0000';
const DARK = '#17171A';
const WHITE = '#FFFFFF';
const BLACK = '#000000';

export const TAGS = ['URGENTE', 'AO VIVO', 'PLANTÃO', 'EXCLUSIVO'] as const;
export const MAX_TAG_LENGTH = 22;
export type PostTag = string;

export const FORMATS = {
  feed: { label: 'Feed quadrado', short: 'Quadrado', size: '1080 × 1080', w: 1080, h: 1080 },
  retrato: { label: 'Feed retrato', short: 'Retrato', size: '1080 × 1350', w: 1080, h: 1350 },
  stories: { label: 'Stories / Reels', short: 'Stories', size: '1080 × 1920', w: 1080, h: 1920 },
} as const;
export type PostFormat = keyof typeof FORMATS;

export type PostLayout = 'destaque' | 'foto';

export interface HeadlinePosition {
  x: number;
  y: number;
}

export interface PostOptions {
  format: PostFormat;
  layout: PostLayout;
  tag: PostTag;
  headline: string;
  headlinePosition: HeadlinePosition | null;
  subline: string;
}

/** Caixa virtual da tarja: 1000 × 200 (mesma proporção do molde). */
const BW = 1000;
const BH = 200;

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  lineWidth = 0
) {
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke && lineWidth) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/** Desenha um texto vetorial, com contorno preto opcional (largura externa = outline). */
function drawText(
  ctx: CanvasRenderingContext2D,
  d: string,
  fill: string,
  outline = 0,
  outlineColor = BLACK
) {
  const path = new Path2D(d);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (outline > 0) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outline * 2;
    ctx.stroke(path);
  }
  ctx.fillStyle = fill;
  ctx.fill(path);
}

/** Desenha a tarja do molde: bloco vermelho inclinado + VN + selo + VACARIA NEWS. */
export function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, tag: PostTag) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Corpo preto arredondado
  fillRound(ctx, 10, 10, 980, 180, 26, DARK, BLACK, 7);

  // Faixa vermelha inclinada (recortada dentro do arredondado)
  ctx.save();
  roundPath(ctx, 10, 10, 980, 180, 26);
  ctx.clip();
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(330, 10);
  ctx.lineTo(282, 190);
  ctx.lineTo(10, 190);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // VN branco com contorno preto (folga dentro da faixa vermelha)
  const sVn = fitSize('slab', 'VN', 200);
  const vn = lineText('slab', 'VN', sVn, { x: 160, y: 100 + capHeight('slab', sVn) / 2 + 22 });
  drawText(ctx, vn, WHITE, 8);

  // Selo vermelho com a palavra do plantão
  const tagText = tag.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR').slice(0, MAX_TAG_LENGTH);
  if (tagText) {
    const spacing = tagText.length > 12 ? 1.5 : 3;
    const availableWidth = 570 - 54 - Math.max(0, tagText.length - 1) * spacing;
    const tagSize = Math.min(34, fitSize('sans', tagText, availableWidth));
    const tagW = measure('sans', tagText, tagSize, spacing) + 54;
    fillRound(ctx, 350, 44, tagW, 56, 12, RED);
    const tagD = lineText('sans', tagText, tagSize, {
      x: 350 + tagW / 2,
      y: 44 + 28 + capHeight('sans', tagSize) / 2,
      spacing,
    });
    drawText(ctx, tagD, WHITE);
  }

  // Nome por extenso
  const nameSize = fitSize('sans', 'VACARIA NEWS', 580);
  const nameD = lineText('sans', 'VACARIA NEWS', nameSize, { x: 350 + 290, y: 180 });
  drawText(ctx, nameD, WHITE);

  ctx.restore();
}

function wrap(text: string, size: number, maxW: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    if (measure('sans', word, size, 2) > maxW) {
      if (cur) lines.push(cur);
      cur = '';
      for (const char of word) {
        if (cur && measure('sans', cur + char, size, 2) > maxW) {
          lines.push(cur);
          cur = '';
        }
        cur += char;
      }
      continue;
    }
    const candidate = cur ? `${cur} ${word}` : word;
    if (cur && measure('sans', candidate, size, 2) > maxW) {
      lines.push(cur);
      cur = word;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fitHeadline(text: string, maxW: number, maxLines: number, base: number) {
  for (let size = base; size >= 16; size -= 2) {
    const lines = wrap(text, size, maxW);
    if (lines.length <= maxLines && lines.every((l) => measure('sans', l, size, 2) <= maxW)) {
      return { size, lines: lines.slice(0, maxLines) };
    }
  }
  return { size: 16, lines: wrap(text, 16, maxW).slice(0, maxLines) };
}

function postPlacement(options: PostOptions) {
  const { w, h } = FORMATS[options.format];
  const scale = (w * 0.92) / BW;
  const bannerH = BH * scale;
  const isStory = options.format === 'stories';
  const isRetrato = options.format === 'retrato';
  const bannerY = options.layout === 'foto'
    ? h - bannerH - (isStory ? h * 0.13 : h * 0.085)
    : isStory ? h * 0.69 : isRetrato ? h * 0.66 : h * 0.62;
  return {
    w,
    h,
    scale,
    bannerH,
    bannerX: (w - BW * scale) / 2,
    bannerY,
    base: isStory ? 112 : isRetrato ? 98 : 88,
    defaultTop: h * (isStory ? 0.21 : isRetrato ? 0.17 : 0.15),
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Calcula também a área arrastável, mantendo a manchete dentro da imagem e acima da tarja. */
export function getHeadlineLayout(options: PostOptions) {
  const { w, h, bannerY, base, defaultTop } = postPlacement(options);
  const text = (options.headline.trim() || 'SUA MANCHETE AQUI').toLocaleUpperCase('pt-BR');
  const { size, lines } = fitHeadline(text, w * 0.86, 3, base);
  const lineHeight = size * 1.2;
  const widest = Math.max(140, measure('sans', 'VACARIA NEWS', 26, 7), ...lines.map((line) => measure('sans', line, size, 2)));
  const halfWidth = Math.min(w / 2 - 24, widest / 2 + 14);
  const relativeTop = -64 - capHeight('sans', 26) - 14;
  const relativeBottom = lines.length * lineHeight + 22 + 9 + 14;
  const minTop = 24 - relativeTop;
  const maxTop = Math.max(minTop, Math.min(h - relativeBottom - 24, bannerY - relativeBottom - 24));
  const desiredX = options.headlinePosition ? (options.headlinePosition.x / 100) * w : w / 2;
  const desiredTop = options.headlinePosition ? (options.headlinePosition.y / 100) * h : defaultTop;
  const centerX = clamp(desiredX, halfWidth + 24, w - halfWidth - 24);
  const top = clamp(desiredTop, minTop, maxTop);

  return {
    canvasWidth: w,
    canvasHeight: h,
    centerX,
    top,
    left: centerX - halfWidth,
    boxTop: top + relativeTop,
    width: halfWidth * 2,
    height: relativeBottom - relativeTop,
    minTop,
    maxTop,
    defaultTop: clamp(defaultTop, minTop, maxTop),
    lines,
    size,
    lineHeight,
  };
}

export type HeadlinePreset = 'top' | 'middle' | 'bottom';

export function getHeadlinePresetPosition(options: PostOptions, preset: HeadlinePreset, layout = getHeadlineLayout(options)): HeadlinePosition {
  const target = preset === 'top' ? layout.defaultTop : preset === 'bottom' ? layout.maxTop : (layout.defaultTop + layout.maxTop) / 2;
  return { x: (layout.centerX / layout.canvasWidth) * 100, y: (target / layout.canvasHeight) * 100 };
}

function drawHeadline(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof getHeadlineLayout>) {
  const cap = capHeight('sans', layout.size);
  layout.lines.forEach((line, i) => {
    const d = lineText('sans', line, layout.size, { x: layout.centerX, y: layout.top + cap + i * layout.lineHeight, spacing: 2 });
    drawText(ctx, d, WHITE, 3);
  });
  const underlineY = layout.top + layout.lines.length * layout.lineHeight + 22;
  ctx.fillStyle = RED;
  ctx.fillRect(layout.centerX - 70, underlineY, 140, 9);
}

function drawSmallLabel(ctx: CanvasRenderingContext2D, x: number, y: number, color = RED) {
  const d = lineText('sans', 'VACARIA NEWS', 26, { x, y, spacing: 7 });
  drawText(ctx, d, color, 2);
}

function drawCenteredLine(ctx: CanvasRenderingContext2D, text: string, w: number, y: number, maxSize = 34) {
  const clean = text.trim();
  if (!clean) return;
  const size = Math.min(maxSize, fitSize('sans', clean.toUpperCase(), w * 0.84));
  const d = lineText('sans', clean.toUpperCase(), size, { x: w / 2, y, spacing: 1 });
  drawText(ctx, d, '#D6D6DA', 2);
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Renderiza o post completo no canvas, já no tamanho exato do Instagram. */
export function renderPost(
  canvas: HTMLCanvasElement,
  options: PostOptions,
  photo: HTMLImageElement | null
) {
  const { w, h, scale, bannerH, bannerX, bannerY } = postPlacement(options);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  if (options.layout === 'foto' && photo) {
    drawCover(ctx, photo, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.62)');
    grad.addColorStop(0.42, 'rgba(0,0,0,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#0E0E11';
    ctx.fillRect(0, 0, w, h);

    // Brilho vermelho discreto e VN gigante ao fundo
    const glow = ctx.createRadialGradient(w / 2, h * 0.48, 0, w / 2, h * 0.48, w * 0.85);
    glow.addColorStop(0, 'rgba(255,0,0,0.13)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const ghostSize = fitSize('slab', 'VN', w * 1.15);
    const ghost = lineText('slab', 'VN', ghostSize, {
      x: w / 2,
      y: h * 0.54 + capHeight('slab', ghostSize) / 2,
    });
    drawText(ctx, ghost, 'rgba(255,255,255,0.045)');

    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, w, 12);
    ctx.fillRect(0, h - 12, w, 12);
  }

  // Manchete
  const headline = getHeadlineLayout(options);
  drawSmallLabel(ctx, headline.centerX, headline.top - 64, options.layout === 'foto' ? WHITE : RED);
  drawHeadline(ctx, headline);

  // Tarja do molde
  drawBanner(ctx, bannerX, bannerY, scale, options.tag);

  drawCenteredLine(ctx, options.subline, w, bannerY + bannerH + 70);
}

/** Só a tarja, com fundo transparente em volta, para usar como adesivo/overlay. */
export function renderBannerOnly(canvas: HTMLCanvasElement, tag: PostTag) {
  const scale = 2.16;
  canvas.width = BW * scale;
  canvas.height = BH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBanner(ctx, 0, 0, scale, tag);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))), type, 0.95);
  });
}
