import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import JSZip from 'jszip';
import { ArrowDown, ArrowRight, Download, FileArchive, ImagePlus, Layers3 } from 'lucide-react';
import { composeIdentityLogo, IDENTITY_CONCEPTS, MAX_SLOGAN_LENGTH, type LogoInk, type SloganPosition } from '../data/identityConcepts';
import { IDENTITY_PHOTO } from '../data/identityPhoto';
import { loadImage, svgBlob, svgToRaster } from '../utils/exportUtils';
import { useDeliver } from './DownloadDialog';
import { PublicationGuide } from './PublicationGuide';

type PreviewBackground = 'photo' | 'dark' | 'light' | 'checker';

const BACKGROUNDS: { id: PreviewBackground; label: string }[] = [
  { id: 'photo', label: 'Foto' },
  { id: 'dark', label: 'Escuro' },
  { id: 'light', label: 'Claro' },
  { id: 'checker', label: 'Xadrez' },
];

const inkName = (ink: LogoInk) => ink === 'white' ? 'branco' : 'preto';

function LogoArtwork({ artwork, className = '' }: { artwork: string; className?: string }) {
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: artwork }} />;
}

interface IdentityStudioProps {
  onOpenOldLogos: () => void;
}

export function IdentityStudio({ onOpenOldLogos }: IdentityStudioProps) {
  const deliver = useDeliver();
  const [selectedId, setSelectedId] = useState(IDENTITY_CONCEPTS[0].id);
  const [ink, setInk] = useState<LogoInk>('white');
  const [slogan, setSlogan] = useState(() => {
    try { return (localStorage.getItem('vn-identity-slogan') || '').slice(0, MAX_SLOGAN_LENGTH); } catch { return ''; }
  });
  const [sloganPosition, setSloganPosition] = useState<SloganPosition>(() => {
    try { return localStorage.getItem('vn-identity-slogan-position') === 'below' ? 'below' : 'right'; } catch { return 'right'; }
  });
  const [background, setBackground] = useState<PreviewBackground>('photo');
  const [photoUrl, setPhotoUrl] = useState(IDENTITY_PHOTO);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoObjectUrl = useRef<string | null>(null);
  const selected = useMemo(() => IDENTITY_CONCEPTS.find((concept) => concept.id === selectedId) || IDENTITY_CONCEPTS[0], [selectedId]);
  const selectedArtwork = useMemo(() => composeIdentityLogo(selected, ink, slogan, sloganPosition), [selected, ink, slogan, sloganPosition]);

  useEffect(() => () => { if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current); }, []);
  useEffect(() => {
    try {
      localStorage.setItem('vn-identity-slogan', slogan);
      localStorage.setItem('vn-identity-slogan-position', sloganPosition);
    } catch { /* A prévia continua funcionando sem armazenamento local. */ }
  }, [slogan, sloganPosition]);

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setError('Escolha uma imagem para a prévia.');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      await loadImage(url);
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
      photoObjectUrl.current = url;
      setPhotoUrl(url);
      setBackground('photo');
      setError('');
    } catch {
      URL.revokeObjectURL(url);
      setError('Não foi possível abrir essa foto. Tente outra imagem.');
    }
  };

  const downloadSelected = async (format: 'png' | 'svg') => {
    if (busy) return;
    setBusy(format);
    setError('');
    try {
      const artwork = composeIdentityLogo(selected, ink, slogan, sloganPosition);
      const filename = `${selected.id}-${inkName(ink)}${slogan.trim() ? '-com-slogan' : ''}-transparente.${format}`;
      const blob = format === 'png'
        ? await svgToRaster(artwork.svg, 2000, Math.round(2000 * artwork.height / artwork.width), 'image/png')
        : svgBlob(artwork.svg);
      deliver(blob, filename);
    } catch {
      setError('Não foi possível gerar o arquivo. Tente novamente.');
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
      let completed = 0;
      for (const concept of IDENTITY_CONCEPTS) {
        for (const color of ['white', 'black'] as const) {
          const artwork = composeIdentityLogo(concept, color, slogan, sloganPosition);
          const name = `${concept.id}-${inkName(color)}${slogan.trim() ? '-com-slogan' : ''}-transparente`;
          const png = await svgToRaster(artwork.svg, 2000, Math.round(2000 * artwork.height / artwork.width), 'image/png');
          zip.file(`PNG/${name}.png`, png);
          zip.file(`SVG/${name}.svg`, artwork.svg);
          setProgress(++completed);
        }
      }
      zip.file('LEIA-ME.txt', `ESTUDOS DE LOGO - VACARIA NEWS

Quatro propostas em PNG transparente e SVG vetorial, cada uma com letras brancas ou pretas.
Use letras brancas sobre fundos escuros e letras pretas sobre fundos claros.
Quando preenchido no aplicativo, o slogan é incluído na posição escolhida.
As fotos mostradas na prévia não fazem parte dos arquivos.
Os modelos são propostas de identidade, não uma marca final aprovada.
`);
      deliver(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }), 'propostas-logo-vacaria-news.zip');
    } catch {
      setError('Não foi possível gerar o pacote. Você pode baixar cada proposta separadamente.');
    } finally {
      setBusy('');
      setProgress(0);
    }
  };

  return (
    <div className="identity-page">
      <div className="identity-heading">
        <div>
          <p className="studio-eyebrow"><span /> ESTUDOS DE IDENTIDADE</p>
          <h1>Vacaria News<span>.</span></h1>
          <p>Quatro aplicações com as letras tradicionais do VN e fundo transparente.</p>
        </div>
        <div className="identity-heading-actions">
          <button className="identity-package" disabled={!!busy} onClick={downloadPackage}>
            <FileArchive size={17} /> {busy === 'zip' ? `Preparando ${progress}/8...` : 'Baixar todas as propostas'}
          </button>
          <button className="identity-backup-jump" onClick={() => document.getElementById('identity-backup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Publicar grátis em HTTPS <ArrowDown size={14} /></button>
        </div>
      </div>

      {error && <p className="identity-error" role="alert">{error}</p>}
      {busy === 'zip' && <p className="identity-progress" role="status">Gerando PNGs e vetores. Isso pode levar alguns segundos.</p>}

      <div className="identity-workspace">
        <section className="identity-preview" id="identity-preview" aria-labelledby="identity-preview-title">
          <div className="identity-section-heading">
            <div><p className="section-kicker">APLICAÇÃO NA IMAGEM</p><h2 id="identity-preview-title">{selected.name}</h2></div>
            <span>PRÉVIA</span>
          </div>
          <div className={`identity-scene identity-bg-${background}`} role="img" aria-label={`Simulação da logo ${selected.name} em fundo ${BACKGROUNDS.find((item) => item.id === background)?.label.toLowerCase()}${slogan.trim() ? `, com slogan ${slogan} ${sloganPosition === 'right' ? 'à direita' : 'embaixo'}` : ''}`}>
            {background === 'photo' && <><img className="identity-scene-photo" src={photoUrl} alt="" /><span className="identity-scene-shade" /></>}
            <LogoArtwork key={`${selected.id}-${ink}-${sloganPosition}`} artwork={selectedArtwork.svg} className={`identity-scene-logo ${slogan.trim() && sloganPosition === 'right' ? 'identity-scene-logo-wide' : ''}`} />
          </div>
          <div className="identity-preview-caption">
            <p>O fundo é apenas uma prévia. A logo baixada não tem fundo.</p>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={choosePhoto} className="sr-only" aria-label="Escolher foto para prévia da logo" />
            <button onClick={() => photoInputRef.current?.click()}><ImagePlus size={15} /> Usar minha foto</button>
          </div>
          {photoUrl === IDENTITY_PHOTO && background === 'photo' && <p className="identity-photo-credit">Foto ilustrativa de Caxambu/MG: <a href="https://www.pexels.com/photo/aerial-view-of-city-18617511/" target="_blank" rel="noreferrer">Douglas Mendes / Pexels</a>.</p>}

          <div className="identity-slogan field-group">
            <div className="field-label-row"><label htmlFor="identity-slogan">Slogan <em>opcional</em></label><span>{slogan.length}/{MAX_SLOGAN_LENGTH}</span></div>
            <input id="identity-slogan" value={slogan} onChange={(event) => setSlogan(event.target.value)} maxLength={MAX_SLOGAN_LENGTH} placeholder="Digite o slogan do Vacaria News" />
            <div className="identity-setting-row identity-slogan-position">
              <span>Posição do slogan</span>
              <div className="identity-segment" role="group" aria-label="Posição do slogan">
                <button onClick={() => setSloganPosition('right')} aria-pressed={sloganPosition === 'right'}>À direita</button>
                <button onClick={() => setSloganPosition('below')} aria-pressed={sloganPosition === 'below'}>Embaixo</button>
              </div>
            </div>
            <p className="field-help">Preencha a frase para vê-la na posição escolhida e incluí-la no arquivo.</p>
          </div>
          <div className="identity-settings">
            <div className="identity-setting-row">
              <span>Fundo da prévia</span>
              <div className="identity-segment" role="group" aria-label="Fundo da prévia">
                {BACKGROUNDS.map((item) => <button key={item.id} onClick={() => setBackground(item.id)} aria-pressed={background === item.id}>{item.label}</button>)}
              </div>
            </div>
            <div className="identity-setting-row">
              <span>Cor das letras</span>
              <div className="identity-segment" role="group" aria-label="Cor das letras">
                <button onClick={() => setInk('white')} aria-pressed={ink === 'white'}>Brancas</button>
                <button onClick={() => setInk('black')} aria-pressed={ink === 'black'}>Pretas</button>
              </div>
            </div>
          </div>
          {((background === 'light' && ink === 'white') || (background === 'dark' && ink === 'black')) && (
            <div className="identity-contrast-hint" role="status">
              <span>Para melhorar o contraste neste fundo:</span>
              <button onClick={() => setInk(background === 'light' ? 'black' : 'white')}>{background === 'light' ? 'Usar letras pretas' : 'Usar letras brancas'}</button>
            </div>
          )}
          <div className="identity-downloads">
            <button className="identity-download-primary" disabled={!!busy} onClick={() => downloadSelected('png')}><Download size={17} /> {busy === 'png' ? 'Gerando PNG...' : 'Baixar PNG transparente'}</button>
            <button className="identity-download-secondary" disabled={!!busy} onClick={() => downloadSelected('svg')}><Layers3 size={16} /> Baixar SVG</button>
          </div>
          <p className="identity-download-hint">Use letras brancas em fundos escuros e pretas em fundos claros. PNG em alta resolução e SVG vetorial.</p>
        </section>

        <section className="identity-ideas" id="identity-ideas" aria-labelledby="identity-ideas-title">
          <div className="identity-ideas-heading"><div><p className="section-kicker">QUATRO CAMINHOS</p><h2 id="identity-ideas-title">Escolha uma ideia</h2></div><ArrowDown size={16} /></div>
          <div className="identity-idea-list">
            {IDENTITY_CONCEPTS.map((concept, index) => (
              <button key={concept.id} className="identity-idea" onClick={() => setSelectedId(concept.id)} aria-pressed={selected.id === concept.id}>
                <span className={`identity-idea-art ${ink === 'black' ? 'identity-idea-art-light' : ''}`}><LogoArtwork artwork={concept.svg(ink)} className="identity-idea-logo" /></span>
                <span className="identity-idea-text"><strong>{concept.name}</strong><small>{concept.description}</small></span>
                <span className="identity-idea-number">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
          <button className="identity-old-link" onClick={onOpenOldLogos}>Ver logos anteriores <ArrowRight size={14} /></button>
          <p className="identity-ideas-note">São estudos visuais para você escolher, não uma marca final aprovada.</p>
        </section>
      </div>
      <PublicationGuide />
    </div>
  );
}