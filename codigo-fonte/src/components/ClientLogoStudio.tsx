import { useMemo, useState } from 'react';
import { Download, Palette, RotateCcw, Sparkles, Type } from 'lucide-react';
import { CHECKER_STYLE } from '../utils/checker';
import { useDeliver } from './DownloadDialog';

type LogoLayout = 'horizontal' | 'stacked' | 'emblem' | 'minimal';
type IconKind = 'monogram' | 'spark' | 'shield' | 'leaf' | 'bolt' | 'building' | 'circle' | 'diamond';
type FontStyle = 'modern' | 'editorial' | 'clean';
type BgMode = 'transparent' | 'dark' | 'light' | 'primary';

interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { id: 'blue', name: 'Azul', primary: '#1d4ed8', accent: '#60a5fa' },
  { id: 'emerald', name: 'Verde', primary: '#047857', accent: '#34d399' },
  { id: 'gold', name: 'Dourado', primary: '#b45309', accent: '#fbbf24' },
  { id: 'red', name: 'Vermelho', primary: '#dc2626', accent: '#f87171' },
  { id: 'purple', name: 'Roxo', primary: '#6d28d9', accent: '#a78bfa' },
  { id: 'slate', name: 'Grafite', primary: '#18181b', accent: '#a1a1aa' },
];

const ICONS: { id: IconKind; label: string }[] = [
  { id: 'monogram', label: 'Iniciais' },
  { id: 'spark', label: 'Estrela' },
  { id: 'shield', label: 'Escudo' },
  { id: 'leaf', label: 'Folha' },
  { id: 'bolt', label: 'Raio' },
  { id: 'building', label: 'Prédio' },
  { id: 'circle', label: 'Anel' },
  { id: 'diamond', label: 'Losango' },
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'EM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderIconSvg(
  icon: IconKind,
  initials: string,
  x: number,
  y: number,
  size: number,
  primary: string,
  accent: string,
  fontFamily: string
): string {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.18;

  const bg = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${primary}" />`;

  switch (icon) {
    case 'monogram':
      return `${bg}<text x="${cx}" y="${cy + size * 0.14}" text-anchor="middle" font-family="${fontFamily}" font-weight="900" font-size="${size * 0.42}" fill="#ffffff" letter-spacing="-0.03em">${escapeXml(initials)}</text>`;
    case 'spark':
      return `${bg}<path d="M${cx} ${y + size * 0.2} L${cx + size * 0.08} ${cy - size * 0.08} L${x + size * 0.8} ${cy} L${cx + size * 0.08} ${cy + size * 0.08} L${cx} ${y + size * 0.8} L${cx - size * 0.08} ${cy + size * 0.08} L${x + size * 0.2} ${cy} L${cx - size * 0.08} ${cy - size * 0.08} Z" fill="${accent}" />`;
    case 'shield':
      return `${bg}<path d="M${cx} ${y + size * 0.2} L${x + size * 0.76} ${y + size * 0.3} V${y + size * 0.52} C${x + size * 0.76} ${y + size * 0.68} ${cx} ${y + size * 0.8} ${cx} ${y + size * 0.8} C${cx} ${y + size * 0.8} ${x + size * 0.24} ${y + size * 0.68} ${x + size * 0.24} ${y + size * 0.52} V${y + size * 0.3} Z" fill="none" stroke="#ffffff" stroke-width="${size * 0.065}" stroke-linejoin="round" />`;
    case 'leaf':
      return `${bg}<path d="M${x + size * 0.28} ${y + size * 0.72} C${x + size * 0.28} ${y + size * 0.38} ${x + size * 0.52} ${y + size * 0.24} ${x + size * 0.76} ${y + size * 0.24} C${x + size * 0.76} ${y + size * 0.52} ${x + size * 0.62} ${y + size * 0.72} ${x + size * 0.28} ${y + size * 0.72} Z" fill="${accent}" /><path d="M${x + size * 0.28} ${y + size * 0.72} L${x + size * 0.62} ${y + size * 0.38}" stroke="#ffffff" stroke-width="${size * 0.055}" stroke-linecap="round" />`;
    case 'bolt':
      return `${bg}<path d="M${cx + size * 0.04} ${y + size * 0.2} L${x + size * 0.3} ${cy + size * 0.04} H${cx} L${cx - size * 0.04} ${y + size * 0.8} L${x + size * 0.7} ${cy - size * 0.04} H${cx} Z" fill="${accent}" />`;
    case 'building':
      return `${bg}<rect x="${x + size * 0.28}" y="${y + size * 0.26}" width="${size * 0.44}" height="${size * 0.5}" rx="${size * 0.04}" fill="none" stroke="#ffffff" stroke-width="${size * 0.06}" /><line x1="${x + size * 0.42}" y1="${y + size * 0.4}" x2="${x + size * 0.42}" y2="${y + size * 0.48}" stroke="${accent}" stroke-width="${size * 0.07}" stroke-linecap="round" /><line x1="${x + size * 0.58}" y1="${y + size * 0.4}" x2="${x + size * 0.58}" y2="${y + size * 0.48}" stroke="${accent}" stroke-width="${size * 0.07}" stroke-linecap="round" /><line x1="${x + size * 0.42}" y1="${y + size * 0.58}" x2="${x + size * 0.42}" y2="${y + size * 0.66}" stroke="${accent}" stroke-width="${size * 0.07}" stroke-linecap="round" /><line x1="${x + size * 0.58}" y1="${y + size * 0.58}" x2="${x + size * 0.58}" y2="${y + size * 0.66}" stroke="${accent}" stroke-width="${size * 0.07}" stroke-linecap="round" />`;
    case 'circle':
      return `${bg}<circle cx="${cx}" cy="${cy}" r="${size * 0.24}" fill="none" stroke="${accent}" stroke-width="${size * 0.08}" />`;
    case 'diamond':
      return `${bg}<polygon points="${cx},${y + size * 0.2} ${x + size * 0.8},${cy} ${cx},${y + size * 0.8} ${x + size * 0.2},${cy}" fill="${accent}" />`;
  }
}

export function ClientLogoStudio() {
  const deliver = useDeliver();
  const [companyName, setCompanyName] = useState('Serra Café');
  const [slogan, setSlogan] = useState('TORREFAÇÃO ARTESANAL');
  const [customInitials, setCustomInitials] = useState('');
  const [layout, setLayout] = useState<LogoLayout>('horizontal');
  const [icon, setIcon] = useState<IconKind>('monogram');
  const [fontStyle, setFontStyle] = useState<FontStyle>('modern');
  const [primaryColor, setPrimaryColor] = useState('#1d4ed8');
  const [accentColor, setAccentColor] = useState('#60a5fa');
  const [bgMode, setBgMode] = useState<BgMode>('transparent');

  const initials = (customInitials.trim() || getInitials(companyName)).slice(0, 3).toUpperCase();
  const displayName = companyName.trim() || 'Sua Empresa';
  const displaySlogan = slogan.trim();

  const fontFamily =
    fontStyle === 'editorial'
      ? "'Alfa Slab One', Georgia, serif"
      : fontStyle === 'modern'
        ? "'Montserrat', Inter, sans-serif"
        : "Inter, system-ui, sans-serif";

  const textColor =
    bgMode === 'light' ? '#111114' : bgMode === 'primary' ? '#ffffff' : bgMode === 'dark' ? '#ffffff' : '#ffffff';
  const subColor =
    bgMode === 'light' ? '#52525b' : bgMode === 'primary' ? 'rgba(255,255,255,0.8)' : '#a1a1aa';

  const svgWidth = layout === 'horizontal' ? 1200 : 1024;
  const svgHeight = layout === 'horizontal' ? 500 : 1024;

  const svgString = useMemo(() => {
    const bgRect =
      bgMode === 'transparent'
        ? ''
        : `<rect width="${svgWidth}" height="${svgHeight}" fill="${
            bgMode === 'dark' ? '#111114' : bgMode === 'light' ? '#f8fafc' : primaryColor
          }" />`;

    const iconPrimary = bgMode === 'primary' ? 'rgba(255,255,255,0.16)' : primaryColor;
    const nameSize = displayName.length > 16 ? 64 : displayName.length > 11 ? 78 : 92;

    if (layout === 'horizontal') {
      const iconSvg = renderIconSvg(icon, initials, 110, 140, 220, iconPrimary, accentColor, fontFamily);
      const textY = displaySlogan ? 245 : 275;
      const sloganSvg = displaySlogan
        ? `<text x="375" y="315" font-family="${fontFamily}" font-weight="700" font-size="26" fill="${subColor}" letter-spacing="0.18em">${escapeXml(displaySlogan.toUpperCase())}</text>`
        : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  ${bgRect}
  ${iconSvg}
  <text x="375" y="${textY}" font-family="${fontFamily}" font-weight="900" font-size="${nameSize}" fill="${textColor}" letter-spacing="-0.03em">${escapeXml(displayName)}</text>
  ${sloganSvg}
</svg>`;
    }

    if (layout === 'stacked') {
      const iconSvg = renderIconSvg(icon, initials, 382, 210, 260, iconPrimary, accentColor, fontFamily);
      const sloganSvg = displaySlogan
        ? `<text x="512" y="680" text-anchor="middle" font-family="${fontFamily}" font-weight="700" font-size="28" fill="${subColor}" letter-spacing="0.2em">${escapeXml(displaySlogan.toUpperCase())}</text>`
        : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  ${bgRect}
  ${iconSvg}
  <text x="512" y="600" text-anchor="middle" font-family="${fontFamily}" font-weight="900" font-size="${nameSize}" fill="${textColor}" letter-spacing="-0.03em">${escapeXml(displayName)}</text>
  ${sloganSvg}
</svg>`;
    }

    if (layout === 'emblem') {
      const sloganSvg = displaySlogan
        ? `<text x="512" y="660" text-anchor="middle" font-family="${fontFamily}" font-weight="700" font-size="24" fill="${accentColor}" letter-spacing="0.22em">${escapeXml(displaySlogan.toUpperCase())}</text>`
        : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  ${bgRect}
  <circle cx="512" cy="512" r="360" fill="${iconPrimary}" stroke="${accentColor}" stroke-width="14" />
  <text x="512" y="485" text-anchor="middle" font-family="${fontFamily}" font-weight="900" font-size="160" fill="#ffffff" letter-spacing="-0.04em">${escapeXml(initials)}</text>
  <text x="512" y="595" text-anchor="middle" font-family="${fontFamily}" font-weight="800" font-size="44" fill="#ffffff" letter-spacing="0.06em">${escapeXml(displayName.toUpperCase())}</text>
  ${sloganSvg}
</svg>`;
    }

    // minimal
    const sloganSvg = displaySlogan
      ? `<text x="512" y="610" text-anchor="middle" font-family="${fontFamily}" font-weight="700" font-size="28" fill="${subColor}" letter-spacing="0.22em">${escapeXml(displaySlogan.toUpperCase())}</text>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  ${bgRect}
  <rect x="442" y="370" width="140" height="12" rx="6" fill="${accentColor}" />
  <text x="512" y="520" text-anchor="middle" font-family="${fontFamily}" font-weight="900" font-size="${nameSize + 10}" fill="${textColor}" letter-spacing="-0.04em">${escapeXml(displayName)}</text>
  ${sloganSvg}
</svg>`;
  }, [accentColor, bgMode, displayName, displaySlogan, fontFamily, icon, initials, layout, primaryColor, subColor, svgHeight, svgWidth, textColor]);

  const slug = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'empresa';

  const handleDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    deliver(blob, `logo-${slug}.svg`);
  };

  const handleDownloadPng = () => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        canvas.toBlob((blob) => {
          if (blob) deliver(blob, `logo-${slug}.png`);
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  const handleReset = () => {
    setCompanyName('Serra Café');
    setSlogan('TORREFAÇÃO ARTESANAL');
    setCustomInitials('');
    setLayout('horizontal');
    setIcon('monogram');
    setFontStyle('modern');
    setPrimaryColor('#1d4ed8');
    setAccentColor('#60a5fa');
    setBgMode('transparent');
  };

  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <p className="studio-eyebrow"><span />ESTÚDIO DE MARCAS</p>
          <h1>Criar <span>Logomarca</span></h1>
          <p>Monte logomarcas personalizadas para outras empresas e baixe em PNG transparente ou SVG vetorial.</p>
        </div>
      </div>

      <div className="editor-grid">
        <div>
          <div className="section-heading preview-heading">
            <div>
              <p className="section-kicker">PRÉVIA AO VIVO <span>/</span> {svgWidth}×{svgHeight}PX</p>
              <h2>Resultado da marca</h2>
            </div>
            <div className="live-label"><span />AO VIVO</div>
          </div>

          <div
            className="preview-stage"
            style={
              bgMode === 'transparent'
                ? CHECKER_STYLE
                : {
                    background:
                      bgMode === 'dark' ? '#111114' : bgMode === 'light' ? '#f8fafc' : primaryColor,
                  }
            }
          >
            <div
              className="w-full max-w-[540px] flex items-center justify-center p-4"
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          </div>

          <div className="preview-footer">
            <div className="preview-file-info">
              <span className="file-icon"><Sparkles size={16} /></span>
              <span>
                <strong>logo-{slug}</strong>
                <small>{bgMode === 'transparent' ? 'Fundo transparente' : 'Com fundo'} <i /> PNG &amp; SVG</small>
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="photo-shortcut" onClick={handleDownloadSvg}>
                <Download size={15} /> Baixar SVG
              </button>
              <button
                type="button"
                className="photo-shortcut"
                style={{ background: '#e91e29', borderColor: '#ff4850', color: '#fff' }}
                onClick={handleDownloadPng}
              >
                <Download size={15} /> Baixar PNG
              </button>
            </div>
          </div>
        </div>

        <aside className="edit-panel">
          <div className="edit-panel-heading">
            <div>
              <p className="section-kicker">IDENTIDADE DA EMPRESA</p>
              <h2>Personalizar marca</h2>
              <p>Altere nome, ícone, cores e formato em tempo real.</p>
            </div>
            <button type="button" className="reset-button" onClick={handleReset} title="Restaurar padrão" aria-label="Restaurar padrão">
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="editor-fields">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
              Nome da empresa
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={32}
                placeholder="Ex: Serra Café"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-2 flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                Slogan / Subtítulo
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  maxLength={36}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                Iniciais
                <input
                  type="text"
                  value={customInitials}
                  onChange={(e) => setCustomInitials(e.target.value)}
                  maxLength={3}
                  placeholder={getInitials(companyName)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white uppercase focus:border-red-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-300">Formato</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ['horizontal', 'Horizontal'],
                    ['stacked', 'Vertical'],
                    ['emblem', 'Brasão'],
                    ['minimal', 'Minimal'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLayout(id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      layout === id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {layout !== 'minimal' && layout !== 'emblem' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-300">Símbolo</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {ICONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                        icon === item.id
                          ? 'border-red-500 bg-red-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Type size={13} /> Tipografia
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['modern', 'Moderna'],
                    ['editorial', 'Editorial'],
                    ['clean', 'Limpa'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFontStyle(id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      fontStyle === id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Palette size={13} /> Cores da marca
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setAccentColor(preset.accent);
                    }}
                    title={preset.name}
                    className="h-7 w-7 rounded-full border border-white/20 transition hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${preset.primary} 55%, ${preset.accent} 55%)` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300">
                  Primária
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-6 w-8 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300">
                  Destaque
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-6 w-8 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-300">Fundo da exportação</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ['transparent', 'Transp.'],
                    ['dark', 'Escuro'],
                    ['light', 'Claro'],
                    ['primary', 'Marca'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBgMode(id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      bgMode === id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
