import { capHeight, fitSize, lineText } from './outline';

export const GC_WIDTH = 1500;
export const GC_HEIGHT = 180;
export const GC_FRAME_WIDTH = 1920;
export const GC_FRAME_HEIGHT = 1080;
export const GC_MAX_NAME = 60;
export const GC_MAX_ROLE = 60;

const GC_X = 80;
const GC_Y = 825;
const RED = '#FF0000';
const WHITE = '#FFFFFF';
const BLACK = '#101010';

export interface GcContent {
  name: string;
  role: string;
}

function drawBand(ctx: CanvasRenderingContext2D, left: number, top: number, end: number, height: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(end - 45, top);
  ctx.lineTo(end, top + height);
  ctx.lineTo(left, top + height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
}

function drawContained(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height);
}

function drawLogo(ctx: CanvasRenderingContext2D, customLogo: HTMLImageElement | null) {
  ctx.fillStyle = RED;
  ctx.fillRect(14, 14, 198, 150);
  if (customLogo) {
    drawContained(ctx, customLogo, 18, 18, 190, 142);
    return;
  }
  const size = fitSize('slab', 'VN', 160);
  const path = new Path2D(lineText('slab', 'VN', size, { x: 113, y: 89 + capHeight('slab', size) / 2 }));
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.stroke(path);
  ctx.fillStyle = WHITE;
  ctx.fill(path);
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, fallback: string, x: number, y: number, maxWidth: number, color: string) {
  const value = text.trim().replace(/\s+/g, ' ') || fallback;
  const base = 49;
  ctx.font = `400 ${base}px Arial, sans-serif`;
  const measured = ctx.measureText(value).width;
  const size = measured > maxWidth ? base * maxWidth / measured : base;
  ctx.font = `400 ${size}px Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** GC independente da tarja de notícias: nome na faixa branca e profissão na vermelha. */
export function drawGc(ctx: CanvasRenderingContext2D, content: GcContent, customLogo: HTMLImageElement | null, x = 0, y = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 3;
  drawBand(ctx, 208, 14, 1060, 75, WHITE);
  drawBand(ctx, 208, 89, 1450, 75, RED);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawLogo(ctx, customLogo);
  drawLabel(ctx, content.name, 'Nome do entrevistado', 245, 51.5, 735, BLACK);
  drawLabel(ctx, content.role, 'Profissão ou cargo', 245, 126.5, 1120, WHITE);
  ctx.restore();
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

export function renderGcPreview(canvas: HTMLCanvasElement, content: GcContent, photo: HTMLImageElement | null, logo: HTMLImageElement | null) {
  canvas.width = GC_FRAME_WIDTH;
  canvas.height = GC_FRAME_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.fillStyle = '#17171a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (photo) drawCover(ctx, photo, canvas.width, canvas.height);
  drawGc(ctx, content, logo, GC_X, GC_Y);
}

export function renderGcPng(canvas: HTMLCanvasElement, content: GcContent, logo: HTMLImageElement | null, fullFrame: boolean) {
  canvas.width = fullFrame ? GC_FRAME_WIDTH : GC_WIDTH;
  canvas.height = fullFrame ? GC_FRAME_HEIGHT : GC_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGc(ctx, content, logo, fullFrame ? GC_X : 0, fullFrame ? GC_Y : 0);
}