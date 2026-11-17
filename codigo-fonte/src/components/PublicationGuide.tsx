import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileArchive, Share2 } from 'lucide-react';
import { formatBytes } from '../utils/exportUtils';
import { createHostingPackage, createStandaloneHtml, loadPortableBackup } from '../utils/portableBackup';

type FileKind = 'hosting' | 'backup' | 'html';

interface PreparedFile {
  blob: Blob;
  filename: string;
  url: string;
  kind: FileKind;
  canShare: boolean;
}

export function PublicationGuide() {
  const [busy, setBusy] = useState<FileKind | ''>('');
  const [prepared, setPrepared] = useState<PreparedFile | null>(null);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const readyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => () => { if (prepared) URL.revokeObjectURL(prepared.url); }, [prepared]);
  useEffect(() => {
    if (prepared) readyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [prepared]);

  const prepare = async (kind: FileKind) => {
    if (busy) return;
    setBusy(kind);
    setError('');
    try {
      const blob = kind === 'hosting' ? await createHostingPackage() : kind === 'backup' ? await loadPortableBackup() : await createStandaloneHtml();
      const filename = kind === 'hosting' ? 'vn-studio-para-publicar.zip' : kind === 'backup' ? 'vn-studio-copia-completa.zip' : 'vn-studio.html';
      let canShare = false;
      try {
        canShare = !!navigator.canShare && !!navigator.share && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] });
      } catch { canShare = false; }
      if (!mounted.current) return;
      setPrepared({ blob, filename, url: URL.createObjectURL(blob), kind, canShare });
    } catch {
      if (mounted.current) setError('Não foi possível preparar o arquivo. Se você já possui a cópia completa, use a pasta aplicativo-pronto que está no ZIP.');
    } finally {
      if (mounted.current) setBusy('');
    }
  };

  const share = async () => {
    if (!prepared || !prepared.canShare) return;
    try {
      await navigator.share({ files: [new File([prepared.blob], prepared.filename, { type: prepared.blob.type })], title: 'VN Studio' });
    } catch (reason) {
      if (reason instanceof Error && reason.name !== 'AbortError') setError('Não foi possível compartilhar. Tente o botão Salvar arquivo ou abra em outro navegador.');
    }
  };

  return (
    <section className="publication-guide" id="identity-backup" aria-labelledby="publication-title">
      <p className="section-kicker">USAR FORA DO ARENA</p>
      <h2 id="publication-title">Publicar com HTTPS gratuito</h2>
      <p>Para criar seu próprio endereço, use uma conta gratuita do Cloudflare Pages.</p>
      <ol className="publication-steps">
        <li><span>1</span><p>Prepare o pacote abaixo e toque em <strong>Salvar arquivo</strong>. Se o aparelho oferecer, use também <strong>Compartilhar</strong> para salvar em Arquivos ou no Drive.</p></li>
        <li><span>2</span><p>Entre no <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer">painel do Cloudflare</a>. Abra <strong>Workers &amp; Pages</strong>, escolha <strong>Create application</strong>, <strong>Get started</strong> e <strong>Drag and drop your files</strong>.</p></li>
        <li><span>3</span><p>Escolha um nome, envie o ZIP preparado e selecione <strong>Deploy site</strong>. O endereço <strong>pages.dev</strong> terá HTTPS.</p></li>
      </ol>

      <div className="publication-actions">
        <button className="publication-primary" disabled={!!busy} onClick={() => prepare('hosting')}><FileArchive size={16} /> {busy === 'hosting' ? 'Preparando...' : 'Preparar pacote para publicar (.zip)'}</button>
        <button className="publication-secondary" disabled={!!busy} onClick={() => prepare('backup')}><Download size={16} /> {busy === 'backup' ? 'Preparando...' : 'Preparar cópia com código-fonte'}</button>
      </div>

      {prepared && (
        <div className="publication-ready" ref={readyRef} role="status">
          <div><strong>Arquivo pronto: {prepared.filename}</strong><span>{formatBytes(prepared.blob.size)}. Toque para salvar no aparelho.</span></div>
          <div className="publication-ready-actions">
            <a href={prepared.url} download={prepared.filename}><Download size={15} /> Salvar arquivo</a>
            {prepared.canShare && <button onClick={share}><Share2 size={15} /> Compartilhar / Salvar em Arquivos</button>}
            {prepared.kind === 'html' && <a href={prepared.url} target="_blank" rel="noreferrer">Abrir HTML em outra aba</a>}
          </div>
        </div>
      )}
      <details className="publication-help">
        <summary>Se o ZIP não baixar</summary>
        <p>Abra o aplicativo em uma aba do Chrome ou Safari, fora da prévia do Arena, e tente salvar ou compartilhar. No celular, procure a opção <strong>Salvar em Arquivos</strong>.</p>
        <p>Como alternativa, você pode preparar um HTML único. Ele contém os editores, mas sozinho não inclui os arquivos para instalação offline nem a cópia do código.</p>
        <button disabled={!!busy} onClick={() => prepare('html')}><Download size={15} /> {busy === 'html' ? 'Preparando...' : 'Preparar HTML único'}</button>
      </details>
      {error && <p className="publication-error" role="alert">{error}</p>}
      <p className="publication-note">A conta gratuita está sujeita aos limites do provedor. Se o site for público, seus arquivos e a cópia do código também poderão ser acessados. Fotos e rascunhos continuam em cada aparelho e não são sincronizados automaticamente.</p>
      <a className="publication-docs" href="https://developers.cloudflare.com/pages/get-started/direct-upload/" target="_blank" rel="noreferrer">Instruções oficiais do Cloudflare <ExternalLink size={13} /></a>
    </section>
  );
}