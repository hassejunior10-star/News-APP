import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { Circle, Download, FileArchive, Maximize2, Square, X } from 'lucide-react';
import { PROFILE_LOGOS, type ProfileLogo } from '../data/profileLogos';
import { svgToRaster } from '../utils/exportUtils';
import { useDeliver } from './DownloadDialog';

type Shape = 'circle' | 'square';
type ImageFormat = 'png' | 'jpg';

function ProfileArtwork({ logo, shape, label }: { logo: ProfileLogo; shape: Shape; label?: string }) {
  return (
    <span
      className={`profile-artwork ${shape === 'circle' ? 'profile-circle' : 'profile-square'}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: logo.svg }}
    />
  );
}

export function ProfileGallery() {
  const deliver = useDeliver();
  const [shape, setShape] = useState<Shape>('circle');
  const [preview, setPreview] = useState<ProfileLogo | null>(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closePreview = useCallback(() => {
    setPreview(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, closePreview]);

  const downloadImage = async (logo: ProfileLogo, format: ImageFormat) => {
    if (busy) return;
    setBusy(`${logo.id}.${format}`);
    setError('');
    try {
      const type = format === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await svgToRaster(logo.svg, 1080, 1080, type);
      setPreview(null);
      deliver(blob, `${logo.id}.${format}`);
    } catch {
      setError('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setBusy('');
    }
  };

  const downloadPackage = async () => {
    if (busy) return;
    setBusy('zip');
    setProgress(0);
    setError('');
    try {
      const zip = new JSZip();
      for (const [index, logo] of PROFILE_LOGOS.entries()) {
        zip.file(`PNG/${logo.id}.png`, await svgToRaster(logo.svg, 1080, 1080, 'image/png'));
        zip.file(`JPG/${logo.id}.jpg`, await svgToRaster(logo.svg, 1080, 1080, 'image/jpeg'));
        zip.file(`SVG/${logo.id}.svg`, logo.svg);
        setProgress(index + 1);
      }
      zip.file('LEIA-ME.txt', `FOTOS DE PERFIL VN - VACARIA NEWS

Este pacote contém 8 modelos em PNG, JPG e SVG.
Os PNG e JPG têm 1080 x 1080 pixels e foram desenhados para o recorte redondo de perfis.

1. Escolha o modelo de sua preferência na pasta PNG ou JPG.
2. Abra o Instagram, Facebook ou WhatsApp e toque na sua foto de perfil.
3. Escolha a opção de editar foto e selecione o arquivo baixado.
4. Ajuste o recorte circular antes de confirmar.
`);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      deliver(blob, 'kit-vn-fotos-de-perfil.zip');
    } catch {
      setError('Não foi possível gerar o pacote. Você pode baixar cada modelo individualmente.');
    } finally {
      setBusy('');
      setProgress(0);
    }
  };

  return (
    <div className="profiles-page">
      <div className="profiles-intro">
        <div>
          <p className="studio-eyebrow"><span /> COLEÇÃO PARA REDES SOCIAIS</p>
          <h1>O VN no seu perfil<span>.</span></h1>
          <p>Escolha sua favorita para o WhatsApp, Instagram, Facebook e outras redes.</p>
        </div>
        <div className="profiles-batch-wrap">
          <button className="profiles-batch" disabled={!!busy} onClick={downloadPackage}>
            <FileArchive size={17} /> {busy === 'zip' ? `Preparando ${progress}/${PROFILE_LOGOS.length}...` : 'Baixar todos os modelos'}
          </button>
          <span aria-live="polite">{busy === 'zip' ? 'Isso pode levar alguns segundos.' : 'Pacote ZIP com PNG, JPG e SVG'}</span>
        </div>
      </div>

      <div className="profiles-toolbar">
        <div>
          <h2>Escolha seu modelo</h2>
          <p>8 modelos. Toque em uma imagem para ampliar antes de baixar.</p>
        </div>
        <div className="shape-picker" role="group" aria-label="Formato da prévia">
          <span>PRÉVIA</span>
          <button onClick={() => setShape('circle')} aria-pressed={shape === 'circle'}><Circle size={15} /> Redonda</button>
          <button onClick={() => setShape('square')} aria-pressed={shape === 'square'}><Square size={15} /> Quadrada</button>
        </div>
      </div>

      {error && <p className="profiles-error" role="alert">{error}</p>}

      <div className="profile-grid">
        {PROFILE_LOGOS.map((logo, index) => (
          <article className="profile-item" key={logo.id}>
            <button className="profile-art" onClick={(event) => { triggerRef.current = event.currentTarget; setPreview(logo); }} aria-label={`Ampliar ${logo.name}`}>
              <ProfileArtwork logo={logo} shape={shape} />
              <span className="profile-zoom" aria-hidden="true"><Maximize2 size={14} /></span>
            </button>
            <div className="profile-info">
              <div><h3>{logo.name}</h3><p>{logo.description}</p></div>
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="profile-actions">
              <button disabled={!!busy} onClick={() => downloadImage(logo, 'png')} aria-label={`Baixar PNG ${logo.name}`}><Download size={15} /> {busy === `${logo.id}.png` ? 'Preparando...' : 'Baixar PNG'}</button>
              <button disabled={!!busy} onClick={() => downloadImage(logo, 'jpg')} aria-label={`Baixar JPG ${logo.name}`}>JPG</button>
            </div>
          </article>
        ))}
      </div>

      <div className="profiles-howto">
        <span className="profiles-howto-line" />
        <p><strong>Para usar:</strong> baixe sua favorita, abra a foto de perfil na rede social e selecione a imagem. Os arquivos são quadrados (1080 × 1080 px); ajuste o recorte redondo antes de confirmar.</p>
      </div>

      {preview && createPortal(
        <div className="profile-modal-backdrop" onClick={closePreview}>
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-header">
              <div><span>PRÉVIA DO MODELO</span><h2 id="profile-preview-title">{preview.name}</h2></div>
              <button ref={closeRef} onClick={closePreview} aria-label="Fechar prévia"><X size={19} /></button>
            </div>
            <div className="profile-modal-art"><ProfileArtwork logo={preview} shape={shape} label={`Prévia ampliada da logo ${preview.name}`} /></div>
            <p>A imagem baixada é quadrada e fica pronta para ajustar no perfil.</p>
            {error && <p className="profiles-error" role="alert">{error}</p>}
            <div className="profile-modal-actions">
              <button disabled={!!busy} onClick={() => downloadImage(preview, 'png')}><Download size={16} /> Baixar PNG</button>
              <button disabled={!!busy} onClick={() => downloadImage(preview, 'jpg')}>Baixar JPG</button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}