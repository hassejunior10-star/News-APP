import { arcText, capHeight, fitSize, lineText, measure, type FontKey } from '../utils/outline';

export interface ProfileLogo {
  id: string;
  name: string;
  description: string;
  svg: string;
}

const RED = '#FF0000';
const BLACK = '#101012';
const WHITE = '#FFFFFF';

const canvas = (background: string, art: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="${background}"/>${art}</svg>`;

function word(font: FontKey, text: string, width: number, baseline: number, fill: string, stroke = 'none', strokeWidth = 0, spacing = 0) {
  const size = ((width - spacing * (text.length - 1)) / measure(font, text, 1000)) * 1000;
  const path = lineText(font, text, size, { x: 500, y: baseline, spacing });
  return `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke fill"/>`;
}

function vn(width: number, centerY: number, fill = WHITE, stroke = '#000000', strokeWidth = 30) {
  const size = fitSize('slab', 'VN', width);
  const path = lineText('slab', 'VN', size, { x: 500, y: centerY + capHeight('slab', size) / 2 });
  return `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke fill"/>`;
}

const ringText = (text: string, side: 'top' | 'bottom', radius: number, size: number, color: string) =>
  `<path d="${arcText('sans', text, size, { cx: 500, cy: 500, r: radius, side, spacing: 7 })}" fill="${color}"/>`;

// All essential lettering stays inside the circular profile crop.
export const PROFILE_LOGOS: ProfileLogo[] = [
  {
    id: 'vn-classica',
    name: 'VN Clássica',
    description: 'A essência vermelha da marca',
    svg: canvas(RED,
      `${vn(610, 466, WHITE, '#000000', 36)}<rect x="354" y="642" width="292" height="9" fill="#000000"/>${word('sans', 'VACARIA NEWS', 410, 706, WHITE, '#000000', 7, 2)}`),
  },
  {
    id: 'vn-redacao',
    name: 'VN Redação',
    description: 'Círculo vermelho sobre preto',
    svg: canvas(BLACK,
      `<circle cx="500" cy="500" r="365" fill="${RED}"/><circle cx="500" cy="500" r="326" fill="${BLACK}" stroke="${WHITE}" stroke-width="8"/>${word('sans', 'VACARIA NEWS', 370, 305, WHITE, 'none', 0, 5)}${vn(455, 483, WHITE, '#000000', 18)}<rect x="390" y="665" width="220" height="9" fill="${RED}"/>`),
  },
  {
    id: 'vn-selo',
    name: 'VN Selo',
    description: 'Visual de selo com nome completo',
    svg: canvas(RED,
      `<circle cx="500" cy="500" r="370" fill="${BLACK}"/><circle cx="500" cy="500" r="342" fill="none" stroke="${WHITE}" stroke-width="8"/><circle cx="500" cy="500" r="226" fill="${RED}" stroke="${WHITE}" stroke-width="7"/>${ringText('VACARIA', 'top', 282, 76, WHITE)}${ringText('NEWS', 'bottom', 310, 64, WHITE)}<circle cx="219" cy="500" r="10" fill="${WHITE}"/><circle cx="781" cy="500" r="10" fill="${WHITE}"/>${vn(335, 500, WHITE, '#000000', 22)}`),
  },
  {
    id: 'vacaria-news-completo',
    name: 'Nome Completo',
    description: 'Inspirada na logo original',
    svg: canvas(RED,
      `${word('slab', 'VACARIA', 700, 456, WHITE, '#000000', 28)}${word('slab', 'NEWS', 700, 657, WHITE, '#000000', 32)}`),
  },
  {
    id: 'vn-clara',
    name: 'VN Fundo Claro',
    description: 'Vermelho e preto sobre branco',
    svg: canvas('#F5F4F1',
      `<circle cx="500" cy="500" r="358" fill="none" stroke="${RED}" stroke-width="12"/><circle cx="500" cy="500" r="334" fill="none" stroke="${BLACK}" stroke-width="3"/>${vn(555, 465, RED, '#000000', 26)}<rect x="365" y="638" width="270" height="8" fill="${RED}"/>${word('sans', 'VACARIA NEWS', 410, 705, BLACK, 'none', 0, 2)}`),
  },
  {
    id: 'vn-diagonal',
    name: 'VN Diagonal',
    description: 'Vermelho e preto em movimento',
    svg: canvas(BLACK,
      `<path d="M0 0H830L415 1000H0Z" fill="${RED}"/><circle cx="500" cy="500" r="369" fill="none" stroke="${WHITE}" stroke-opacity=".35" stroke-width="5"/>${vn(550, 465, WHITE, '#000000', 36)}<rect x="283" y="641" width="434" height="70" rx="4" fill="${WHITE}"/>${word('sans', 'VACARIA NEWS', 378, 688, BLACK, 'none', 0, 2)}`),
  },
  {
    id: 'vn-noturna',
    name: 'VN Noturna',
    description: 'Preto com detalhe vermelho',
    svg: canvas('#08080A',
      `<circle cx="500" cy="500" r="362" fill="none" stroke="${RED}" stroke-width="17"/><circle cx="500" cy="500" r="333" fill="none" stroke="#4D1A1D" stroke-width="4"/>${vn(550, 476, WHITE, RED, 24)}<rect x="370" y="648" width="260" height="9" fill="${RED}"/>${word('sans', 'VACARIA NEWS', 395, 711, WHITE, 'none', 0, 3)}`),
  },
  {
    id: 'vn-quadro',
    name: 'VN Em Quadro',
    description: 'Uma assinatura em destaque',
    svg: canvas(RED,
      `<rect x="220" y="234" width="560" height="532" rx="55" fill="${BLACK}"/><rect x="238" y="252" width="524" height="496" rx="41" fill="none" stroke="${WHITE}" stroke-opacity=".25" stroke-width="5"/>${vn(440, 466, WHITE, '#000000', 14)}<rect x="359" y="629" width="282" height="8" fill="${RED}"/>${word('sans', 'VACARIA NEWS', 390, 696, WHITE, 'none', 0, 2)}`),
  },
];