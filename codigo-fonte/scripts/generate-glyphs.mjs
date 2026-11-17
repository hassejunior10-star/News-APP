// Converte as letras usadas nas logos em contornos vetoriais (curvas),
// para que PNG/SVG exportados não dependam de nenhuma fonte instalada.
// Uso: node scripts/generate-glyphs.mjs
import fs from 'node:fs';
import opentype from 'opentype.js';

const load = (p) => {
  const b = fs.readFileSync(p);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' +
  'ÁÀÂÃÄáàâãäÉÊéêÍíÓÔÕóôõÚúÇçªº°•–—…©®';

const sources = {
  slab: {
    font: load('node_modules/@fontsource/alfa-slab-one/files/alfa-slab-one-latin-400-normal.woff'),
    chars: 'VACRINEWS',
  },
  sans: {
    font: load('node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff'),
    chars: alphabet,
  },
};

const r = (n) => Math.round(n * 10) / 10;
const out = {};

for (const [key, { font, chars }] of Object.entries(sources)) {
  const glyphs = {};
  const kern = {};
  const list = [...chars];

  const available = [];
  for (const ch of list) {
    const g = font.charToGlyph(ch);
    if (!g || g.index === 0) continue;
    available.push(ch);
    const cmds = g.path.commands
      .map((c) => {
        if (c.type === 'Z') return 'Z';
        if (c.type === 'Q') return `Q ${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
        if (c.type === 'C') return `C ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
        return `${c.type} ${r(c.x)} ${r(c.y)}`;
      })
      .join(' ');
    glyphs[ch] = { a: g.advanceWidth, c: cmds };
  }

  for (const a of available) {
    for (const b of available) {
      const k = font.getKerningValue(font.charToGlyph(a), font.charToGlyph(b));
      if (k) kern[a + b] = k;
    }
  }

  const ref = font.charToGlyph('E').getBoundingBox();
  out[key] = { upm: font.unitsPerEm, cap: ref.y2, glyphs, kern };
  console.log(key, 'upm', font.unitsPerEm, 'cap', ref.y2, 'glifos', available.length, 'kerning', Object.keys(kern).length);
}

const header =
  '// ARQUIVO GERADO por scripts/generate-glyphs.mjs — não editar à mão.\n' +
  '// Contornos de Alfa Slab One e Montserrat Black (licença SIL Open Font License).\n\n' +
  'export interface GlyphFont {\n  upm: number;\n  cap: number;\n  glyphs: Record<string, { a: number; c: string }>;\n  kern: Record<string, number>;\n}\n\n';

fs.writeFileSync(
  'src/data/glyphs.ts',
  header + 'export const FONT_DATA: Record<"slab" | "sans", GlyphFont> = ' + JSON.stringify(out) + ';\n'
);
