import JSZip from 'jszip';
import { LogoItem } from '../types';

export type RasterType = 'image/png' | 'image/jpeg';

/** SVG como endereço de imagem (para <img> e para desenhar em canvas). */
export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const svgBlob = (svg: string) => new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });

export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: RasterType): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao exportar'))),
      type,
      type === 'image/jpeg' ? 0.95 : undefined
    );
  });
}

/** Converte o SVG da logo em PNG ou JPG no tamanho pedido. */
export async function svgToRaster(svg: string, width: number, height: number, type: RasterType): Promise<Blob> {
  const img = await loadImage(svgDataUrl(svg));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.drawImage(img, 0, 0, width, height);
  try {
    return await canvasToBlob(canvas, type);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const ZIP_WIDTH = 2000;

const README = `KIT DE LOGOS VN - VACARIA NEWS
==============================

PASTAS

PNG-transparente/
  Sem fundo. É o arquivo certo para colocar por cima de fotos e vídeos
  (Canva, CapCut, Photoshop, Stories).

PNG-fundo-vermelho/ e JPG-fundo-vermelho/
  Com o fundo vermelho da marca. Para foto de perfil e capas.

SVG-vetor/
  Vetor com as letras já convertidas em curvas: abre igual em qualquer
  programa e pode ser ampliado sem perder nitidez. Para gráfica, adesivo
  e banner. Há uma versão sem fundo e uma com fundo vermelho.

Os PNG e JPG têm ${ZIP_WIDTH} px de largura.

CORES
  Vermelho  #FF0000
  Preto     #000000
  Branco    #FFFFFF
`;

/** Monta o .zip com todos os modelos em todos os formatos. */
export async function buildZip(logos: LogoItem[], onProgress?: (percent: number, status: string) => void) {
  const zip = new JSZip();
  const total = logos.length;

  for (let i = 0; i < total; i++) {
    const logo = logos[i];
    onProgress?.(Math.round((i / total) * 90), `Gerando ${logo.name}…`);

    const h = Math.round((ZIP_WIDTH * logo.height) / logo.width);
    const clear = logo.getSvgString('transparent');
    const red = logo.getSvgString('red');

    zip.file(`PNG-transparente/${logo.fileName}-transparente.png`, await svgToRaster(clear, ZIP_WIDTH, h, 'image/png'));
    zip.file(`PNG-fundo-vermelho/${logo.fileName}-fundo-vermelho.png`, await svgToRaster(red, ZIP_WIDTH, h, 'image/png'));
    zip.file(`JPG-fundo-vermelho/${logo.fileName}-fundo-vermelho.jpg`, await svgToRaster(red, ZIP_WIDTH, h, 'image/jpeg'));
    zip.file(`SVG-vetor/${logo.fileName}-transparente.svg`, clear);
    zip.file(`SVG-vetor/${logo.fileName}-fundo-vermelho.svg`, red);
  }

  zip.file('LEIA-ME.txt', README);
  onProgress?.(95, 'Compactando o arquivo .zip…');
  const blob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Pronto!');
  return blob;
}
