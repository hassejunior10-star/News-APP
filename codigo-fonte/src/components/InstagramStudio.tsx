import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react';
import JSZip from 'jszip';
import {
  Check, ChevronDown, CircleAlert, Download, ImagePlus, Image as ImageIcon, Layers3,
  LoaderCircle, Move, PenLine, RefreshCcw, Sparkles,
} from 'lucide-react';
import { loadImage } from '../utils/exportUtils';
import { SAMPLE_PHOTO } from '../data/samplePhoto';
import { DEFAULT_DRAFT, loadDraft, loadDraftPhoto, saveDraft, saveDraftPhoto, StudioDraft } from '../utils/draft';
import { canvasToBlob, FORMATS, getHeadlineLayout, getHeadlinePresetPosition, MAX_TAG_LENGTH, PostFormat, renderBannerOnly, renderPost, TAGS, type HeadlinePreset } from '../utils/post';
import { useDeliver } from './DownloadDialog';

const SAMPLE_URL = SAMPLE_PHOTO;
const FORMAT_NAMES: Record<PostFormat, string> = { feed: 'Quadrado', retrato: 'Retrato', stories: 'Stories' };
const POSITION_PRESETS: { id: HeadlinePreset; label: string }[] = [
  { id: 'top', label: 'Em cima' },
  { id: 'middle', label: 'No meio' },
  { id: 'bottom', label: 'Embaixo' },
];

export function InstagramStudio() {
  const deliver = useDeliver();
  const [initialDraft] = useState(loadDraft);
  const [draft, setDraft] = useState<StudioDraft>(initialDraft);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialDraft.photoSource === 'upload' ? null : SAMPLE_URL);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [restoring, setRestoring] = useState(initialDraft.photoSource === 'upload');
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [storageWarning, setStorageWarning] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [moreFormats, setMoreFormats] = useState(false);
  const [draggingHeadline, setDraggingHeadline] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const headlineDragRef = useRef<{ id: number; clientX: number; clientY: number; x: number; y: number; width: number; height: number } | null>(null);

  const patchDraft = (patch: Partial<StudioDraft>) => setDraft((previous) => ({ ...previous, ...patch }));
  const replaceObjectUrl = (url: string | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
  };

  // A imagem fica no IndexedDB; textos e escolhas pequenas ficam no armazenamento local.
  useEffect(() => {
    if (initialDraft.photoSource !== 'upload') return;
    let active = true;
    loadDraftPhoto().then((blob) => {
      if (!active) return;
      if (!blob) throw new Error('Foto não encontrada');
      const url = URL.createObjectURL(blob);
      replaceObjectUrl(url);
      setPhotoUrl(url);
      setRestoring(false);
    }).catch(() => {
      if (!active) return;
      setPhotoUrl(SAMPLE_URL);
      setDraft((previous) => ({ ...previous, photoSource: 'example', photoName: '' }));
      setStorageWarning('A foto anterior não está disponível. Escolha uma nova foto.');
      setRestoring(false);
    });
    return () => { active = false; };
  }, [initialDraft.photoSource]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  useEffect(() => {
    setStorageStatus('saving');
    const timer = window.setTimeout(() => setStorageStatus(saveDraft(draft) ? 'saved' : 'error'), 450);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (!photoUrl) return;
    let active = true;
    setLoadingPhoto(true);
    setPhoto(null);
    loadImage(photoUrl).then((image) => {
      if (!active) return;
      setPhoto(image);
      setLoadingPhoto(false);
    }).catch(() => {
      if (!active) return;
      setError('Não foi possível abrir a imagem. Escolha outra foto.');
      setLoadingPhoto(false);
    });
    return () => { active = false; };
  }, [photoUrl]);

  useEffect(() => {
    if (canvasRef.current) renderPost(canvasRef.current, draft, photo);
  }, [draft, photo]);

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem, como JPG ou PNG.');
      return;
    }
    setError('');
    setUploading(true);
    const url = URL.createObjectURL(file);
    try {
      await loadImage(url);
      replaceObjectUrl(url);
      setPhotoUrl(url);
      patchDraft({ layout: 'foto', photoSource: 'example', photoName: '' });
      try {
        await saveDraftPhoto(file);
        patchDraft({ photoSource: 'upload', photoName: file.name });
        setStorageWarning('');
      } catch {
        setStorageWarning('A foto está disponível nesta sessão, mas não pôde ser salva no aparelho.');
      }
    } catch {
      URL.revokeObjectURL(url);
      setError('Não foi possível abrir essa foto. Tente uma imagem JPG ou PNG.');
    } finally {
      setUploading(false);
    }
  };

  const resetDraft = () => {
    if (!window.confirm('Começar um novo post? O rascunho atual será substituído.')) return;
    replaceObjectUrl(null);
    setPhotoUrl(SAMPLE_URL);
    setDraft({ ...DEFAULT_DRAFT });
    setError('');
    setStorageWarning('');
    saveDraftPhoto(null).catch(() => setStorageWarning('Não foi possível apagar a foto salva neste aparelho.'));
  };

  const imageReady = draft.layout !== 'foto' || (!!photo && !loadingPhoto && !restoring);
  const outputSize = FORMATS[draft.format];
  const sizeLabel = `${outputSize.w}x${outputSize.h}`;
  const headlineLayout = useMemo(() => getHeadlineLayout(draft), [draft.format, draft.layout, draft.headline, draft.headlinePosition]);
  const currentPreset = POSITION_PRESETS.find(({ id }) => {
    const target = getHeadlinePresetPosition(draft, id, headlineLayout);
    return Math.abs((headlineLayout.top / headlineLayout.canvasHeight) * 100 - target.y) < 0.15;
  })?.id;

  const moveHeadline = (x: number, y: number) => {
    const minX = ((headlineLayout.width / 2 + 24) / headlineLayout.canvasWidth) * 100;
    const minY = (headlineLayout.minTop / headlineLayout.canvasHeight) * 100;
    const maxY = (headlineLayout.maxTop / headlineLayout.canvasHeight) * 100;
    patchDraft({ headlinePosition: { x: Math.max(minX, Math.min(100 - minX, x)), y: Math.max(minY, Math.min(maxY, y)) } });
  };

  const startHeadlineDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    event.preventDefault();
    headlineDragRef.current = {
      id: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: (headlineLayout.centerX / headlineLayout.canvasWidth) * 100,
      y: (headlineLayout.top / headlineLayout.canvasHeight) * 100,
      width: bounds.width,
      height: bounds.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingHeadline(true);
  };

  const dragHeadline = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = headlineDragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    event.preventDefault();
    moveHeadline(drag.x + ((event.clientX - drag.clientX) / drag.width) * 100, drag.y + ((event.clientY - drag.clientY) / drag.height) * 100);
  };

  const endHeadlineDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (headlineDragRef.current?.id !== event.pointerId) return;
    headlineDragRef.current = null;
    setDraggingHeadline(false);
  };

  const moveHeadlineWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    moveHeadline((headlineLayout.centerX / headlineLayout.canvasWidth) * 100 + direction[0] * step, (headlineLayout.top / headlineLayout.canvasHeight) * 100 + direction[1] * step);
  };

  const downloadCurrent = async (type: 'image/png' | 'image/jpeg') => {
    if (!canvasRef.current || !imageReady) return;
    setBusy(type);
    setError('');
    try {
      renderPost(canvasRef.current, draft, photo);
      const blob = await canvasToBlob(canvasRef.current, type);
      deliver(blob, `post-vn-${sizeLabel}.${type === 'image/png' ? 'png' : 'jpg'}`);
    } catch {
      setError('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setBusy('');
    }
  };

  const downloadBanner = async () => {
    setBusy('banner');
    setError('');
    try {
      const canvas = document.createElement('canvas');
      renderBannerOnly(canvas, draft.tag);
      const name = (draft.tag.trim() || 'sem-selo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'selo';
      deliver(await canvasToBlob(canvas, 'image/png'), `tarja-vn-${name}-transparente.png`);
    } catch {
      setError('Não foi possível gerar a tarja. Tente novamente.');
    } finally {
      setBusy('');
    }
  };

  const downloadFormats = async () => {
    if (!imageReady) return;
    setBusy('zip');
    setError('');
    try {
      const zip = new JSZip();
      for (const format of Object.keys(FORMATS) as PostFormat[]) {
        const canvas = document.createElement('canvas');
        renderPost(canvas, { ...draft, format }, photo);
        const { w, h } = FORMATS[format];
        zip.file(`post-vn-${w}x${h}.png`, await canvasToBlob(canvas, 'image/png'));
      }
      deliver(await zip.generateAsync({ type: 'blob' }), 'posts-vn-instagram.zip');
    } catch {
      setError('Não foi possível gerar o pacote. Baixe os formatos individualmente.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <p className="studio-eyebrow"><span /> SEU ESTÚDIO CRIATIVO</p>
          <h1>Vamos criar seu post<span>.</span></h1>
          <p>Da notícia à publicação, tudo na palma da mão.</p>
        </div>
        <div className={`draft-status ${storageStatus === 'error' ? 'draft-status-error' : ''}`} aria-live="polite">
          {storageStatus === 'saving' ? <LoaderCircle size={14} className="spin-icon" /> : storageStatus === 'error' ? <CircleAlert size={14} /> : <Check size={14} />}
          {storageStatus === 'saving' ? 'Salvando rascunho' : storageStatus === 'saved' ? 'Rascunho salvo neste aparelho' : 'Não foi possível salvar o rascunho'}
        </div>
      </div>

      <div className="editor-grid">
        <section className="preview-column" id="post-preview" aria-labelledby="preview-title">
          <div className="section-heading preview-heading">
            <div>
              <p className="section-kicker">MODELO A <span>/</span> INSTAGRAM</p>
              <h2 id="preview-title">Prévia do post</h2>
            </div>
            <div className="preview-heading-actions">
              <div className="live-label"><span /> AO VIVO</div>
              <button className="jump-to-editor" onClick={() => document.getElementById('edit-publication')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><PenLine size={14} /> Editar</button>
            </div>
          </div>
          <div className="preview-stage">
            <div className="preview-canvas-wrap">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Prévia do post em ${outputSize.size} pixels. Manchete: ${draft.headline || 'Sua manchete aqui'}.`}
              />
              <button
                type="button"
                className={`headline-drag-target ${draggingHeadline ? 'is-dragging' : ''}`}
                style={{
                  left: `${(headlineLayout.left / headlineLayout.canvasWidth) * 100}%`,
                  top: `${(headlineLayout.boxTop / headlineLayout.canvasHeight) * 100}%`,
                  width: `${(headlineLayout.width / headlineLayout.canvasWidth) * 100}%`,
                  height: `${(headlineLayout.height / headlineLayout.canvasHeight) * 100}%`,
                }}
                aria-label="Mover manchete. Arraste na foto ou use as setas do teclado."
                title="Arraste para mover a manchete"
                onPointerDown={startHeadlineDrag}
                onPointerMove={dragHeadline}
                onPointerUp={endHeadlineDrag}
                onPointerCancel={endHeadlineDrag}
                onLostPointerCapture={endHeadlineDrag}
                onKeyDown={moveHeadlineWithKeyboard}
              >
                <span className="headline-drag-icon" aria-hidden="true"><Move size={14} /></span>
              </button>
              {(restoring || (draft.layout === 'foto' && loadingPhoto)) && (
                <div className="preview-loading"><LoaderCircle size={23} className="spin-icon" /><span>Carregando prévia...</span></div>
              )}
            </div>
          </div>
          <div className="preview-footer">
            <div className="preview-file-info">
              <span className="file-icon"><ImageIcon size={17} /></span>
              <span><strong>{FORMAT_NAMES[draft.format]} <i /> {outputSize.size} px</strong><small>{draft.layout === 'destaque' ? 'Fundo escuro' : photoUrl === SAMPLE_URL ? 'Foto ilustrativa de exemplo' : 'Sua foto de fundo'}</small></span>
            </div>
            <button className="photo-shortcut" disabled={restoring || uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus size={16} /> <span>Trocar foto</span>
            </button>
          </div>
          <p className="preview-hint"><strong>Arraste a manchete para mudar de lugar.</strong> A borda tracejada não aparece na imagem baixada.{draft.layout === 'foto' && photoUrl === SAMPLE_URL && <> Foto de exemplo: <a href="https://www.pexels.com/photo/cats-on-road-during-a-rainy-day-11636485/" target="_blank" rel="noreferrer">Mauricio Gomes / Pexels</a>.</>}</p>
        </section>

        <section className="edit-panel" id="edit-publication" aria-labelledby="edit-title">
          <div className="edit-panel-heading">
            <div>
              <p className="section-kicker">DEIXE DO SEU JEITO</p>
              <h2 id="edit-title">Editar publicação</h2>
              <p>Preencha os detalhes e veja sua arte na prévia.</p>
            </div>
            <div className="edit-heading-actions">
              <button className="jump-to-preview" onClick={() => document.getElementById('post-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Ver prévia</button>
              <button className="reset-button" onClick={resetDraft} disabled={uploading || restoring} title="Começar um novo post" aria-label="Começar um novo post">
                <RefreshCcw size={17} />
              </button>
            </div>
          </div>

          <div className="editor-fields">
            <div className="field-group">
              <div className="field-label-row"><label htmlFor="post-headline">Manchete</label><span>{draft.headline.length}/90</span></div>
              <textarea id="post-headline" value={draft.headline} onFocus={(event) => { if (draft.headline === DEFAULT_DRAFT.headline) event.currentTarget.select(); }} onChange={(event) => patchDraft({ headline: event.target.value })} maxLength={90} rows={2} placeholder="Escreva a manchete da notícia" />
              <p className="field-help">O texto aparecerá em letras maiúsculas na arte.</p>
            </div>

            <div className="field-group">
              <div className="field-label-row"><span className="field-label">Posição da manchete</span><button className="position-reset" onClick={() => patchDraft({ headlinePosition: null })}>Restaurar</button></div>
              <div className="headline-position-options" role="group" aria-label="Posição da manchete">
                {POSITION_PRESETS.map(({ id, label }) => (
                  <button key={id} onClick={() => patchDraft({ headlinePosition: getHeadlinePresetPosition(draft, id, headlineLayout) })} aria-pressed={currentPreset === id}>{label}</button>
                ))}
              </div>
              <p className="field-help">Ou arraste na prévia. A manchete permanece acima da tarja.</p>
            </div>

            <div className="field-group">
              <div className="field-label-row"><label htmlFor="post-subline">Texto de apoio <em>opcional</em></label></div>
              <input id="post-subline" value={draft.subline} onChange={(event) => patchDraft({ subline: event.target.value })} maxLength={60} placeholder="Ex.: Acompanhe a cobertura" />
            </div>

            <div className="field-group">
              <div className="field-label-row"><span className="field-label">Formato</span><span>INSTAGRAM</span></div>
              <div className="format-options" role="group" aria-label="Formato do Instagram">
                {(Object.keys(FORMATS) as PostFormat[]).map((format) => (
                  <button key={format} onClick={() => patchDraft({ format })} aria-pressed={draft.format === format}>
                    <span className={`format-icon format-${format}`} />
                    <strong>{FORMAT_NAMES[format]}</strong>
                    <small>{format === 'feed' ? '1:1' : format === 'retrato' ? '4:5' : '9:16'}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row"><span className="field-label">Selo da notícia</span></div>
              <div className="tag-options" role="group" aria-label="Selo da notícia">
                {TAGS.map((tag) => <button key={tag} onClick={() => patchDraft({ tag })} aria-pressed={draft.tag.trim().toLocaleUpperCase('pt-BR') === tag}>{tag}</button>)}
              </div>
              <div className="tag-custom-field">
                <div className="field-label-row"><label htmlFor="post-tag">Texto do selo</label><span>{draft.tag.length}/{MAX_TAG_LENGTH}</span></div>
                <input id="post-tag" value={draft.tag} onChange={(event) => patchDraft({ tag: event.target.value })} maxLength={MAX_TAG_LENGTH} placeholder="Escreva o texto do selo" />
                <p className="field-help">O texto aparece em maiúsculas. Deixe vazio para ocultar o selo.</p>
              </div>
            </div>

            <div className="field-group background-field">
              <div className="field-label-row"><span className="field-label">Fundo da publicação</span></div>
              <div className="background-options" role="group" aria-label="Fundo da publicação">
                <button onClick={() => patchDraft({ layout: 'foto' })} aria-pressed={draft.layout === 'foto'}><ImageIcon size={16} /> Com foto</button>
                <button onClick={() => patchDraft({ layout: 'destaque' })} aria-pressed={draft.layout === 'destaque'}><span className="dark-swatch" /> Fundo escuro</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="sr-only" aria-label="Escolher foto" />
              {draft.layout === 'foto' && (
                <button className="upload-link" disabled={restoring || uploading} onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={15} /> {uploading ? 'Preparando sua foto...' : photoUrl === SAMPLE_URL ? 'Escolher uma foto do celular' : 'Trocar minha foto'}
                </button>
              )}
            </div>
          </div>

          {(error || storageWarning) && <p className="editor-alert" role="alert">{error || storageWarning}</p>}
          <div className="editor-actions">
            <button className="download-primary" onClick={() => downloadCurrent('image/png')} disabled={!!busy || !imageReady || uploading}>
              {busy === 'image/png' ? <LoaderCircle size={18} className="spin-icon" /> : <Download size={18} />}
              {busy === 'image/png' ? 'Preparando imagem...' : 'Baixar imagem em PNG'}
            </button>
            <p>Sua imagem em {outputSize.size} px, pronta para publicar.</p>
            <button className="more-formats" onClick={() => setMoreFormats((shown) => !shown)} aria-expanded={moreFormats}>
              Outros formatos e opções <ChevronDown size={16} className={moreFormats ? 'chevron-open' : ''} />
            </button>
            {moreFormats && (
              <div className="extra-downloads">
                <button disabled={!!busy || !imageReady} onClick={() => downloadCurrent('image/jpeg')}><ImageIcon size={16} /> Baixar JPG</button>
                <button disabled={!!busy || !imageReady} onClick={downloadFormats}><Download size={16} /> {busy === 'zip' ? 'Gerando pacote...' : 'Os 3 tamanhos (.zip)'}</button>
                <button disabled={!!busy} onClick={downloadBanner}><Layers3 size={16} /> Só a tarja transparente</button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="studio-bottom-note"><Sparkles size={15} /><span>Sua foto e seu rascunho ficam no seu aparelho. Depois de salvar, compartilhe pelo celular; a publicação no Instagram é manual.</span></div>
    </div>
  );
}