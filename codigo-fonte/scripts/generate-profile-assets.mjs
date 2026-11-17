import { build } from 'esbuild';
import JSZip from 'jszip';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const bundle = await build({
  entryPoints: ['src/data/profileLogos.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const url = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`;
const { PROFILE_LOGOS } = await import(url);
const directory = 'public/perfis';
const zip = new JSZip();

await mkdir(directory, { recursive: true });

for (const logo of PROFILE_LOGOS) {
  const svg = Buffer.from(logo.svg);
  const image = sharp(svg, { density: 110 }).resize(1080, 1080);
  const png = await image.clone().png({ compressionLevel: 9 }).toBuffer();
  const jpg = await image.clone().jpeg({ quality: 95, mozjpeg: true }).toBuffer();

  await Promise.all([
    writeFile(join(directory, `${logo.id}.svg`), svg),
    writeFile(join(directory, `${logo.id}.png`), png),
    writeFile(join(directory, `${logo.id}.jpg`), jpg),
  ]);
  zip.file(`PNG/${logo.id}.png`, png);
  zip.file(`JPG/${logo.id}.jpg`, jpg);
  zip.file(`SVG/${logo.id}.svg`, svg);
  console.log(`Gerado: ${logo.name}`);
}

zip.file('LEIA-ME.txt', `FOTOS DE PERFIL VN - VACARIA NEWS

Este pacote contém 8 modelos, em PNG, JPG e SVG.
Os PNG e JPG têm 1080 x 1080 pixels e foram desenhados para o recorte redondo de perfis.

1. Escolha o modelo de sua preferência na pasta PNG ou JPG.
2. Abra o Instagram, Facebook ou WhatsApp e toque na sua foto de perfil.
3. Escolha a opção de editar foto e selecione o arquivo baixado.
4. Ajuste o recorte circular na tela antes de confirmar.

Os arquivos SVG são vetoriais e servem para edição ou impressão.
`);

const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
await writeFile(join(directory, 'kit-vn-fotos-de-perfil.zip'), archive);
console.log(`Pacote gerado: ${directory}/kit-vn-fotos-de-perfil.zip`);