import JSZip from 'jszip';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const embeddedPath = join(root, 'src/data/portableBackupData.ts');
const publicPath = join(root, 'public/backup/vn-studio-completo.txt');
const placeholder = "// Conteúdo gerado por scripts/create-portable-backup.mjs.\nexport const EMBEDDED_BACKUP_BASE64 = '';\n";
const previousEmbedded = await readFile(embeddedPath).catch(() => null);
const previousPublic = await readFile(publicPath).catch(() => null);

function build() {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error('Não foi possível gerar o aplicativo.');
}

try {
  // A versão dentro do ZIP usa um marcador vazio para evitar incluir o ZIP em si mesmo.
  await writeFile(embeddedPath, placeholder);
  build();
  const zip = new JSZip();

  async function addTree(folder, destination) {
    const entries = await readdir(folder, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const file = join(folder, entry.name);
      const relativePath = relative(root, file).replace(/\\/g, '/');
      if (relativePath === 'public/backup' || relativePath.startsWith('public/backup/') || relativePath === 'dist/backup' || relativePath.startsWith('dist/backup/')) continue;
      if (entry.isDirectory()) await addTree(file, destination);
      else if (entry.isFile()) {
        const base = destination === 'aplicativo-pronto' ? join(root, 'dist') : root;
        zip.file(`${destination}/${relative(base, file).replace(/\\/g, '/')}`, await readFile(file));
      }
    }
  }

  for (const file of ['README.md', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts']) {
    zip.file(`codigo-fonte/${file}`, await readFile(join(root, file)));
  }
  for (const folder of ['src', 'public', 'scripts']) await addTree(join(root, folder), 'codigo-fonte');
  await addTree(join(root, 'dist'), 'aplicativo-pronto');

  zip.file('LEIA-PRIMEIRO.txt', `COPIA DO VN STUDIO - VACARIA NEWS

Guarde este ZIP no computador e em outro lugar seguro, como um serviço de nuvem.
Ele contém o aplicativo pronto e o código-fonte. Fotos, logos enviadas e rascunhos
salvos no navegador não estão nesta cópia; exporte esses arquivos separadamente.

1. USAR NO COMPUTADOR
   Descompacte o ZIP e abra aplicativo-pronto/index.html no navegador.
   A instalação e o armazenamento podem variar quando o arquivo é aberto localmente.
   A pasta aplicativo-pronto não contém um backup de si mesma; guarde este ZIP.

2. PUBLICAR EM HTTPS
   No Cloudflare Pages, escolha Direct Upload e envie a pasta aplicativo-pronto
   ou um ZIP que tenha index.html na raiz. O aplicativo pode preparar esse ZIP.
   Abra o endereço pages.dev no celular e use "Adicionar à tela inicial".
   O site pode ficar público. Os rascunhos não são sincronizados entre aparelhos.

3. EDITAR OU RECRIAR O APLICATIVO
   Na pasta codigo-fonte, instale Node.js e execute npm install e npm run build.
   Para desenvolvimento, use npm run dev. A instalação inicial precisa de internet.
   Para atualizar a cópia embutida, execute node scripts/create-portable-backup.mjs.
   O script gera o aplicativo, monta o backup e faz o build final automaticamente.

Os recursos básicos não dependem do Arena após copiar e hospedar os arquivos.
Algumas fotos externas de exemplo podem precisar de internet. A cópia no cache
do celular não substitui este backup: o sistema pode apagá-la.
`);

  const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const encoded = archive.toString('base64');
  await mkdir(join(root, 'public/backup'), { recursive: true });
  await writeFile(publicPath, encoded);
  await writeFile(embeddedPath, `// Conteúdo gerado por scripts/create-portable-backup.mjs.\nexport const EMBEDDED_BACKUP_BASE64 = '${encoded}';\n`);
  build();
  console.log(`Backup embutido e aplicativo atualizados: ${Math.round(archive.length / 1024)} KB (ZIP).`);
} catch (error) {
  if (previousEmbedded) await writeFile(embeddedPath, previousEmbedded);
  else await rm(embeddedPath, { force: true });
  if (previousPublic) await writeFile(publicPath, previousPublic);
  else await rm(publicPath, { force: true });
  throw error;
}