import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Check, CircleAlert, Download, ImagePlus, LoaderCircle, PenLine, RefreshCcw } from 'lucide-react';
import { GC_SAMPLE_PHOTO } from '../data/gcSamplePhoto';
import { loadDraftLogo, saveDraftLogo } from '../utils/draft';
import { loadImage } from '../utils/exportUtils';
import { DEFAULT_GC_DRAFT, loadGcDraft, saveGcDraft, type GcDraft } from '../utils/gcDraft';
import { GC_MAX_NAME, GC_MAX_ROLE, renderGcPng, renderGcPreview } from '../utils/gc';
import { canvasToBlob } from '../utils/post';
import { useDeliver } from './DownloadDialog';

interface GcStudioProps {
  onOpenPost: () => void;
}

export function GcStudio({ onOpenPost }: GcStudioProps) {
  const deliver = useDeliver();
  const [initialDraft] = useState(loadGcDraft);
  const [draft, setDraft] = useState<GcDraft>(initialDraft);
  const [photoUrl, setPhotoUrl] = useState(GC_SAMPLE_PHOTO);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [customLogo, setCustomLogo] = useState<HTMLImageElement | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [loadingLogo, setLoadingLogo] = useState(initialDraft.logoSource === 'upload');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'compact' | 'frame' | ''>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoUrlRef = useRef<string | null>(null);
  const logoUrlRef = useRef<string | null>(null);

  const patchDraft = (patch: Partial<GcDraft>) => setDraft((previous) => ({ ...previous, ...patch }));

  useEffect(() => {
    setStorageStatus('saving');
    const timer = window.setTimeout(() => setStorageStatus(saveGcDraft(draft) ? 'saved' : 'error'), 450);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    let active = true;
    setLoadingPhoto(true);
    loadImage(photoUrl).then((image) => {
      if (!active) return;
      setPhoto(image);
      setLoadingPhoto(false);
    }).catch(() => {
      if (!active) return;
      setLoadingPhoto(false);
      setError('Não foi possível abrir essa foto de prévia. Tente outra imagem.');
    });
    return () => { active = false; };
  }, [photoUrl]);

  useEffect(() => {
    if (initialDraft.logoSource !== 'upload') return;
    let active = true;
    loadDraftLogo().then(async (blob) => {
      if (!active) return;
      if (!blob) throw new Error('Logo não encontrada');
      const url = URL.createObjectURL(blob);
      try {
        const image = await loadImage(url);
        if (!active) { URL.revokeObjectURL(url); return; }
        if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
        logoUrlRef.current = url;
        setCustomLogo(image);
        setLoadingLogo(false);
      } catch (error) {
        URL.revokeObjectURL(url);
        throw error;
      }
    }).catch(() => {
      if (!active) return;
      patchDraft({ logoSource: 'default', logoName: '' });
      setWarning('A logo anterior não está disponível. A logo VN padrão foi restaurada.');
      setLoadingLogo(false);
    });
    return () => { active = false; };
  }, [initialDraft.logoSource]);

  useEffect(() => () => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
  }, []);

  useEffect(() => {
    if (canvasRef.current) renderGcPreview(canvasRef.current, draft, photo, customLogo);
  }, [draft, photo, customLogo]);

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
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = url;
      setPhotoUrl(url);
      setError('');
    } catch {
      URL.revokeObjectURL(url);
      setError('Não foi possível abrir essa foto de prévia. Tente outra imagem.');
    }
  };

  const chooseLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setUploadingLogo(true);
    let url: string | null = null;
    try {
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)) throw new Error('PNG inválido');
      url = URL.createObjectURL(file);
      const image = await loadImage(url);
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
      logoUrlRef.current = url;
      setCustomLogo(image);
      patchDraft({ logoSource: 'default', logoName: '' });
      try {
        await saveDraftLogo(file);
        patchDraft({ logoSource: 'upload', logoName: file.name });
        setWarning('');
      } catch {
        setWarning('A logo ficará disponível nesta sessão, mas não pôde ser salva no aparelho.');
      }
    } catch {
      if (url && url !== logoUrlRef.current) URL.revokeObjectURL(url);
      setError('Não foi possível abrir a logo. Escolha um arquivo PNG válido.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const restoreLogo = () => {
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    logoUrlRef.current = null;
    setCustomLogo(null);
    patchDraft({ logoSource: 'default', logoName: '' });
    setError('');
    setWarning('');
    saveDraftLogo(null).catch(() => setWarning('Não foi possível apagar a logo salva neste aparelho.'));
  };

  const resetGc = () => {
    if (!window.confirm('Limpar o nome, a profissão e restaurar a logo VN?')) return;
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    logoUrlRef.current = null;
    setCustomLogo(null);
    setDraft({ ...DEFAULT_GC_DRAFT });
    setError('');
    setWarning('');
    saveDraftLogo(null).catch(() => setWarning('Não foi possível apagar a logo salva neste aparelho.'));
  };

  const downloadGc = async (fullFrame: boolean) => {
    if (busy || loadingLogo || uploadingLogo) return;
    setBusy(fullFrame ? 'frame' : 'compact');
    setError('');
    try {
      const canvas = document.createElement('canvas');
      renderGcPng(canvas, draft, customLogo, fullFrame);
      const filename = fullFrame ? 'gc-vn-video-1920x1080.png' : 'gc-vn-entrevista-transparente.png';
      deliver(await canvasToBlob(canvas, 'image/png'), filename);
    } catch {
      setError('Não foi possível gerar o GC. Tente novamente.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <p className="studio-eyebrow"><span /> IDENTIFICAÇÃO PARA VÍDEO</p>
          <h1>GC de entrevista<span>.</span></h1>
          <p>Nome na faixa branca, profissão na vermelha e logo VN no início.</p>
        </div>
        <div className={`draft-status ${storageStatus === 'error' ? 'draft-status-error' : ''}`} aria-live="polite">
          {storageStatus === 'saving' ? <LoaderCircle size={14} className="spin-icon" /> : storageStatus === 'error' ? <CircleAlert size={14} /> : <Check size={14} />}
          {storageStatus === 'saving' ? 'Salvando rascunho' : storageStatus === 'saved' ? 'Rascunho salvo neste aparelho' : 'Não foi possível salvar o rascunho'}
        </div>
      </div>

      <div className="editor-grid">
        <section className="preview-column" id="gc-preview" aria-labelledby="gc-preview-title">
          <div className="section-heading preview-heading">
            <div><p className="section-kicker">GC <span>/</span> VÍDEO 16:9</p><h2 id="gc-preview-title">Prévia do GC</h2></div>
            <div className="preview-heading-actions"><div className="live-label"><span /> AO VIVO</div><button className="jump-to-editor" onClick={() => document.getElementById('gc-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><PenLine size={14} /> Editar</button></div>
          </div>
          <div className="gc-preview-stage">
            <div className="gc-preview-wrap">
              <canvas ref={canvasRef} role="img" aria-label={`Prévia do GC. Nome: ${draft.name || 'nome do entrevistado'}. Profissão: ${draft.role || 'profissão ou cargo'}.`} />
              {(loadingPhoto || loadingLogo) && <div className="preview-loading"><LoaderCircle size={23} className="spin-icon" /><span>Carregando prévia...</span></div>}
            </div>
          </div>
          <div className="preview-footer">
            <div className="preview-file-info"><span className="gc-format-icon">16:9</span><span><strong>Prévia de vídeo</strong><small>{photoUrl === GC_SAMPLE_PHOTO ? 'Foto ilustrativa de exemplo' : 'Sua foto de prévia'}</small></span></div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={choosePhoto} className="sr-only" aria-label="Escolher foto de prévia" />
            <button className="photo-shortcut" onClick={() => photoInputRef.current?.click()}><ImagePlus size={16} /> Trocar foto</button>
          </div>
          <p className="preview-hint"><strong>A foto é apenas para visualizar.</strong> Ela não é incluída no PNG nem salva no rascunho.{photoUrl === GC_SAMPLE_PHOTO && <> Foto ilustrativa: <a href="https://www.pexels.com/photo/a-woman-being-interviewed-7859062/" target="_blank" rel="noreferrer">Greta Hoffman / Pexels</a>.</>}</p>
        </section>

        <section className="edit-panel" id="gc-editor" aria-labelledby="gc-editor-title">
          <div className="edit-panel-heading">
            <div><p className="section-kicker">ENTREVISTA</p><h2 id="gc-editor-title">Editar identificação</h2><p>Preencha os dados e veja o resultado na prévia.</p></div>
            <div className="edit-heading-actions"><button className="jump-to-preview" onClick={() => document.getElementById('gc-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Ver prévia</button><button className="reset-button" onClick={resetGc} disabled={uploadingLogo || loadingLogo} title="Limpar GC" aria-label="Limpar GC"><RefreshCcw size={17} /></button></div>
          </div>
          <div className="editor-fields">
            <div className="field-group">
              <div className="field-label-row"><label htmlFor="gc-name">Nome do entrevistado</label><span>{draft.name.length}/{GC_MAX_NAME}</span></div>
              <input id="gc-name" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} maxLength={GC_MAX_NAME} placeholder="Ex.: Irmã Adelaide Canci" />
              <p className="field-help">Faixa branca, na parte de cima.</p>
            </div>
            <div className="field-group">
              <div className="field-label-row"><label htmlFor="gc-role">Profissão ou cargo</label><span>{draft.role.length}/{GC_MAX_ROLE}</span></div>
              <input id="gc-role" value={draft.role} onChange={(event) => patchDraft({ role: event.target.value })} maxLength={GC_MAX_ROLE} placeholder="Ex.: Diretora Presidente" />
              <p className="field-help">Faixa vermelha, na parte de baixo.</p>
            </div>
            <div className="field-group">
              <div className="field-label-row"><span className="field-label">Logo no início do GC</span></div>
              <div className="gc-logo-control">
                <span className="gc-logo-icon" aria-hidden="true">VN</span>
                <div><strong>{loadingLogo ? 'Carregando logo...' : customLogo ? 'Logo PNG escolhida' : 'Logo VN incluída'}</strong><small>{customLogo ? draft.logoName || 'Sua logo' : 'Vermelha, como na referência'}</small></div>
                <input ref={logoInputRef} type="file" accept="image/png,.png" onChange={chooseLogo} className="sr-only" aria-label="Escolher logo PNG para o GC" />
                <button disabled={uploadingLogo || loadingLogo} onClick={() => logoInputRef.current?.click()}><ImagePlus size={15} /> {uploadingLogo ? 'Enviando...' : 'Trocar PNG'}</button>
              </div>
              {customLogo && <button className="upload-link" disabled={uploadingLogo || loadingLogo} onClick={restoreLogo}>Usar a logo VN padrão</button>}
              <p className="field-help">Opcional: envie a logo original em PNG para substituir a padrão.</p>
            </div>
          </div>
          {(error || warning) && <p className="editor-alert" role="alert">{error || warning}</p>}
          <div className="editor-actions">
            <button className="download-primary" disabled={!!busy || loadingLogo || uploadingLogo} onClick={() => downloadGc(false)}>
              {busy === 'compact' ? <LoaderCircle size={18} className="spin-icon" /> : <Download size={18} />}
              {busy === 'compact' ? 'Gerando GC...' : 'Baixar GC em PNG transparente'}
            </button>
            <p>Arquivo compacto para colocar sobre o vídeo como camada.</p>
            <button className="gc-frame-download" disabled={!!busy || loadingLogo || uploadingLogo} onClick={() => downloadGc(true)}><Download size={16} /> {busy === 'frame' ? 'Gerando...' : 'Baixar no quadro 1920 × 1080'}</button>
            <p>PNG transparente com o GC já posicionado no quadro 16:9.</p>
          </div>
        </section>
      </div>
      <div className="studio-bottom-note"><span>A tarja de notícias para imagens continua na aba <button className="gc-post-link" onClick={onOpenPost}>Criar post</button>. O GC é separado para entrevistas em vídeo.</span></div>
    </div>
  );
}