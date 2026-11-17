import JSZip from 'jszip';
import { EMBEDDED_BACKUP_BASE64 } from '../data/portableBackupData';

async function backupBase64(): Promise<string> {
  if (EMBEDDED_BACKUP_BASE64.startsWith('UEsDB')) return EMBEDDED_BACKUP_BASE64;
  const response = await fetch(`${import.meta.env.BASE_URL}backup/vn-studio-completo.txt`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Backup indisponível');
  const encoded = (await response.text()).trim();
  if (!encoded.startsWith('UEsDB')) throw new Error('Backup inválido');
  return encoded;
}

function decodeBackup(encoded: string): Uint8Array<ArrayBuffer> {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function loadPortableBackup(): Promise<Blob> {
  return new Blob([decodeBackup(await backupBase64())], { type: 'application/zip' });
}

/** Prepara um ZIP com index.html na raiz para hospedagem estática. */
export async function createHostingPackage(): Promise<Blob> {
  const encoded = await backupBase64();
  const backup = await JSZip.loadAsync(decodeBackup(encoded));
  const site = new JSZip();
  const prefix = 'aplicativo-pronto/';
  let hasIndex = false;

  for (const [name, entry] of Object.entries(backup.files)) {
    if (!name.startsWith(prefix) || entry.dir) continue;
    const file = name.slice(prefix.length);
    if (!file || file.split('/').includes('..')) continue;
    if (file === 'index.html') hasIndex = true;
    site.file(file, await entry.async('uint8array'));
  }
  if (!hasIndex) throw new Error('Aplicativo pronto não encontrado');

  // O site publicado também poderá oferecer a mesma cópia completa.
  site.file('backup/vn-studio-completo.txt', encoded);
  site.file('LEIA-PUBLICACAO.txt', `VN STUDIO - PUBLICAÇÃO EM HTTPS

O arquivo index.html está na raiz deste pacote.
No Cloudflare Pages, use Direct Upload para enviar o ZIP ou sua pasta extraída.
O endereço pages.dev gerado usa HTTPS. Publique em uma conta que você controle.
Os rascunhos e fotos ficam no navegador de cada aparelho e não são sincronizados.
Confira a visibilidade do projeto: um site público pode ser acessado por quem tiver o link.
`);
  return site.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/** HTML único de emergência; não inclui arquivos de instalação offline. */
export async function createStandaloneHtml(): Promise<Blob> {
  const backup = await JSZip.loadAsync(decodeBackup(await backupBase64()));
  const file = backup.file('aplicativo-pronto/index.html');
  if (!file) throw new Error('HTML não encontrado');
  return new Blob([await file.async('string')], { type: 'text/html;charset=utf-8' });
}