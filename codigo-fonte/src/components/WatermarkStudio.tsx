import React, { useEffect, useRef, useState } from 'react';
import { Download, Layers, RefreshCw, Sliders, Upload } from 'lucide-react';
import { LogoItem, LogoVariant, WatermarkPosition, WatermarkSettings } from '../types';
import { SAMPLE_NEWS_PHOTOS } from '../data/logos';
import { loadImage, svgDataUrl, svgToRaster } from '../utils/exportUtils';
import { useDeliver } from './DownloadDialog';

interface WatermarkStudioProps {
  logos: LogoItem[];
  defaultSelectedLogoId?: string;
}

const MAX_SIDE = 4096;

const TAGS: Record<WatermarkSettings['bannerType'], string> = {
  urgente: 'URGENTE',
  aovivo: 'AO VIVO',
  plantao: 'PLANTÃO',
  exclusivo: 'EXCLUSIVO',
};

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Em cima, esquerda' },
  { id: 'top-right', label: 'Em cima, direita' },
  { id: 'center', label: 'Centro' },
  { id: 'bottom-left', label: 'Embaixo, esquerda' },
  { id: 'bottom-right', label: 'Embaixo, direita' },
];

const VARIANTS: { id: LogoVariant; label: string }[] = [
  { id: 'transparent', label: 'Sem fundo' },
  { id: 'red', label: 'Fundo vermelho' },
  { id: 'dark', label: 'Fundo preto' },
];

const defaults = (logoId: string): WatermarkSettings => ({
  selectedLogoId: logoId,
  variant: 'transparent',
  position: 'bottom-right',
  sizePercent: 24,
  opacity: 1,
  paddingPercent: 4,
  showBanner: false,
  bannerType: 'urgente',
  bannerText: 'VACARIA NEWS',
});

const chip = (active: boolean) =>
  `py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
    active
      ? 'bg-red-600 text-white border-red-500'
      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
  }`;

export const WatermarkStudio: React.FC<WatermarkStudioProps> = ({ logos, defaultSelectedLogoId }) => {
  const deliver = useDeliver();
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SAMPLE_NEWS_PHOTOS[0].url);
  const [photoName, setPhotoName] = useState('foto-exemplo');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<WatermarkSettings>(() => defaults(defaultSelectedLogoId || logos[0].id));

  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<WatermarkSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const currentLogo = logos.find((l) => l.id === settings.selectedLogoId) || logos[0];

  useEffect(() => {
    if (defaultSelectedLogoId) setSettings((s) => ({ ...s, selectedLogoId: defaultSelectedLogoId }));
  }, [defaultSelectedLogoId]);

  // A tarja usa a fonte Montserrat; redesenha quando ela termina de carregar.
  useEffect(() => {
    document.fonts?.load("700 20px 'Montserrat'").then(() => setFontReady(true), () => setFontReady(true));
  }, []);

  // Carrega a foto de fundo uma única vez por foto.
  useEffect(() => {
    let active = true;
    setBaseImg(null);
    setError(null);
    loadImage(selectedPhoto, !selectedPhoto.startsWith('blob:') && !selectedPhoto.startsWith('data:')).then(
      (img) => active && setBaseImg(img),
      () => active && setError('Não foi possível carregar esta foto. Envie outra imagem.')
    );
    return () => {
      active = false;
    };
  }, [selectedPhoto]);

  // Desenha foto + tarja + logo. O que aparece aqui é exatamente o arquivo baixado.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !baseImg) return;
    let active = true;

    loadImage(svgDataUrl(currentLogo.getSvgString(settings.variant))).then((logoImg) => {
      if (!active) return;
      const scale = Math.min(1, MAX_SIDE / Math.max(baseImg.naturalWidth, baseImg.naturalHeight));
      const cw = Math.round(baseImg.naturalWidth * scale);
      const ch = Math.round(baseImg.naturalHeight * scale);
      canvas.width = cw;
      canvas.height = ch;
      ctx.drawImage(baseImg, 0, 0, cw, ch);

      let bannerH = 0;
      if (settings.showBanner) {
        bannerH = Math.max(36, Math.round(ch * 0.09));
        const mid = ch - bannerH / 2;
        ctx.fillStyle = 'rgba(14,14,16,0.92)';
        ctx.fillRect(0, ch - bannerH, cw, bannerH);

        ctx.textBaseline = 'middle';
        ctx.font = `800 ${Math.round(bannerH * 0.42)}px 'Montserrat', Arial, sans-serif`;
        const tag = TAGS[settings.bannerType];
        const tagW = Math.round(ctx.measureText(tag).width + bannerH * 0.9);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, ch - bannerH, tagW, bannerH);
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(tag, tagW / 2, mid);

        ctx.textAlign = 'left';
        ctx.font = `700 ${Math.round(bannerH * 0.36)}px 'Montserrat', Arial, sans-serif`;
        const gap = Math.round(bannerH * 0.4);
        ctx.fillText(settings.bannerText.trim(), tagW + gap, mid, cw - tagW - gap * 2);
      }

      const lw = (cw * settings.sizePercent) / 100;
      const lh = (lw * currentLogo.height) / currentLogo.width;
      const pad = (Math.min(cw, ch) * settings.paddingPercent) / 100;
      const right = cw - lw - pad;
      const bottom = ch - lh - pad - bannerH;
      const [x, y] = {
        'top-left': [pad, pad],
        'top-right': [right, pad],
        'bottom-left': [pad, bottom],
        'bottom-right': [right, bottom],
        center: [(cw - lw) / 2, (ch - bannerH - lh) / 2],
      }[settings.position];

      ctx.save();
      ctx.globalAlpha = settings.opacity;
      ctx.drawImage(logoImg, x, y, lw, lh);
      ctx.restore();
    });

    return () => {
      active = false;
    };
  }, [baseImg, settings, currentLogo, fontReady]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedPhotoUrl) URL.revokeObjectURL(uploadedPhotoUrl);
    const url = URL.createObjectURL(file);
    setUploadedPhotoUrl(url);
    setSelectedPhoto(url);
    setPhotoName(file.name.replace(/\.[^/.]+$/, '') || 'foto');
    e.target.value = '';
  };

  const downloadPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    setBusy(true);
    setError(null);
    try {
      canvas.toBlob(
        (blob) => {
          setBusy(false);
          if (blob) deliver(blob, `${photoName}-com-logo-vn.jpg`);
          else setError('Não foi possível gerar a imagem. Tente com outra foto.');
        },
        'image/jpeg',
        0.92
      );
    } catch {
      setBusy(false);
      setError('Não foi possível exportar esta foto. Envie a sua própria foto e tente de novo.');
    }
  };

  const downloadLogoOnly = async () => {
    setError(null);
    try {
      const h = Math.round((2000 * currentLogo.height) / currentLogo.width);
      const blob = await svgToRaster(currentLogo.getSvgString('transparent'), 2000, h, 'image/png');
      deliver(blob, `${currentLogo.fileName}-transparente-2000px.png`);
    } catch {
      setError('Não foi possível gerar o PNG. Atualize a página e tente de novo.');
    }
  };

  const label = 'text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2.5';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Sliders className="w-7 h-7 text-red-500 shrink-0" />
          Colocar a logo VN em uma foto
        </h2>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
          Envie a sua foto, ajuste a posição e baixe a imagem pronta. As fotos de exemplo são de banco de imagens, só
          para teste. Sua foto não sai do seu aparelho.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controles */}
        <div className="lg:col-span-5 bg-[#16161B] border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
          <div>
            <span className={label}>1. Foto</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-neutral-900 hover:bg-neutral-800 border border-dashed border-neutral-600 hover:border-red-500 rounded-xl p-3.5 text-sm font-semibold text-neutral-100 transition-colors flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Upload className="w-4 h-4 text-red-500" />
              Enviar minha foto
            </button>

            <div className="grid grid-cols-5 gap-2 mt-3">
              {uploadedPhotoUrl && (
                <button
                  onClick={() => setSelectedPhoto(uploadedPhotoUrl)}
                  aria-label="Usar a minha foto"
                  aria-pressed={selectedPhoto === uploadedPhotoUrl}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    selectedPhoto === uploadedPhotoUrl ? 'border-red-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={uploadedPhotoUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] font-bold text-white text-center py-0.5">
                    SUA FOTO
                  </span>
                </button>
              )}
              {SAMPLE_NEWS_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedPhoto(sample.url);
                    setPhotoName(`foto-exemplo-${sample.id}`);
                  }}
                  aria-label={sample.title}
                  aria-pressed={selectedPhoto === sample.url}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    selectedPhoto === sample.url ? 'border-red-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={sample.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-white text-center py-0.5">
                    {sample.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={label}>2. Modelo da logo</span>
            <div className="grid grid-cols-2 gap-2">
              {logos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => set({ selectedLogoId: logo.id })}
                  aria-pressed={settings.selectedLogoId === logo.id}
                  className={`${chip(settings.selectedLogoId === logo.id)} text-left`}
                >
                  {logo.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={label}>3. Fundo da logo</span>
            <div className="grid grid-cols-3 gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => set({ variant: v.id })}
                  aria-pressed={settings.variant === v.id}
                  className={chip(settings.variant === v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={label}>4. Posição</span>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => set({ position: pos.id })}
                  aria-pressed={settings.position === pos.id}
                  className={`${chip(settings.position === pos.id)} ${pos.id === 'center' ? 'col-span-2' : ''}`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-800">
            {[
              { id: 'wm-size', text: 'Tamanho da logo', value: settings.sizePercent, min: 8, max: 60, step: 1, key: 'sizePercent' as const, show: `${settings.sizePercent}%` },
              { id: 'wm-opacity', text: 'Opacidade', value: settings.opacity, min: 0.2, max: 1, step: 0.05, key: 'opacity' as const, show: `${Math.round(settings.opacity * 100)}%` },
              { id: 'wm-pad', text: 'Distância da borda', value: settings.paddingPercent, min: 0, max: 12, step: 1, key: 'paddingPercent' as const, show: `${settings.paddingPercent}%` },
            ].map((s) => (
              <div key={s.id}>
                <label htmlFor={s.id} className="flex justify-between text-xs font-medium text-neutral-300 mb-1.5">
                  <span>{s.text}</span>
                  <span className="font-mono text-red-400">{s.show}</span>
                </label>
                <input
                  id={s.id}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.value}
                  onChange={(e) => set({ [s.key]: Number(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Tarja no rodapé (opcional)</span>
              <button
                onClick={() => set({ showBanner: !settings.showBanner })}
                aria-pressed={settings.showBanner}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  settings.showBanner ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {settings.showBanner ? 'Ligada' : 'Desligada'}
              </button>
            </div>

            {settings.showBanner && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(TAGS) as WatermarkSettings['bannerType'][]).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => set({ bannerType: tag })}
                      aria-pressed={settings.bannerType === tag}
                      className={chip(settings.bannerType === tag)}
                    >
                      {TAGS[tag]}
                    </button>
                  ))}
                </div>
                <label htmlFor="wm-banner" className="sr-only">
                  Texto da tarja
                </label>
                <input
                  id="wm-banner"
                  type="text"
                  value={settings.bannerText}
                  onChange={(e) => set({ bannerText: e.target.value })}
                  placeholder="Texto da tarja"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Prévia e download */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-28">
          <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-3 sm:p-4 shadow-2xl">
            <div className="rounded-2xl overflow-hidden bg-black min-h-[180px] flex items-center justify-center">
              {error && !baseImg ? (
                <p role="alert" className="text-sm text-red-300 p-6 text-center">
                  {error}
                </p>
              ) : (
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Prévia da foto com a logo VN aplicada"
                  className={`w-full h-auto max-h-[560px] object-contain block ${baseImg ? '' : 'opacity-0'}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between pt-3 px-1 text-xs text-neutral-400">
              <span>A imagem baixada sai igual a esta prévia, no tamanho da foto.</span>
              <button
                onClick={() => setSettings(defaults(logos[0].id))}
                className="shrink-0 ml-3 hover:text-white flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Redefinir
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadPhoto}
              disabled={busy || !baseImg}
              className="flex-1 bg-[#E60000] hover:bg-red-500 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base py-3.5 px-5 rounded-2xl transition-colors flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Download className="w-5 h-5" />
              {busy ? 'Gerando…' : 'Baixar foto com a logo (JPG)'}
            </button>
            <button
              onClick={downloadLogoOnly}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm py-3.5 px-5 rounded-2xl transition-colors flex items-center justify-center gap-2 border border-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Layers className="w-4 h-4 text-red-500" />
              Só a logo (PNG)
            </button>
          </div>

          {error && baseImg && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
