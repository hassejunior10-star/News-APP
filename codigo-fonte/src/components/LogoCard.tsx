import React, { useMemo, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { LogoItem, LogoVariant } from '../types';
import { RasterType, svgBlob, svgDataUrl, svgToRaster } from '../utils/exportUtils';
import { CHECKER_STYLE } from '../utils/checker';
import { useDeliver } from './DownloadDialog';

interface LogoCardProps {
  logo: LogoItem;
  onSelectForWatermark: (logoId: string) => void;
}

const BACKGROUNDS: { id: LogoVariant; label: string }[] = [
  { id: 'transparent', label: 'Sem fundo' },
  { id: 'red', label: 'Vermelho' },
  { id: 'dark', label: 'Preto' },
];

const SIZES = [1080, 2000, 4000];

export const LogoCard: React.FC<LogoCardProps> = ({ logo, onSelectForWatermark }) => {
  const deliver = useDeliver();
  const [bg, setBg] = useState<LogoVariant>(logo.previewVariant);
  const [size, setSize] = useState(2000);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => svgDataUrl(logo.getSvgString(bg)), [logo, bg]);
  const height = Math.round((size * logo.height) / logo.width);

  const downloadRaster = async (key: string, variant: LogoVariant, type: RasterType) => {
    setBusy(key);
    setError(null);
    try {
      const blob = await svgToRaster(logo.getSvgString(variant), size, height, type);
      const suffix = variant === 'transparent' ? 'transparente' : 'fundo-vermelho';
      deliver(blob, `${logo.fileName}-${suffix}-${size}px.${type === 'image/png' ? 'png' : 'jpg'}`);
    } catch {
      setError('Não foi possível gerar o arquivo. Tente um tamanho menor.');
    } finally {
      setBusy(null);
    }
  };

  const downloadSvg = () => {
    deliver(svgBlob(logo.getSvgString('transparent')), `${logo.fileName}-transparente.svg`);
  };

  const secondary =
    'bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-white font-semibold text-xs py-2.5 px-2 rounded-xl border border-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500';

  return (
    <article className="bg-[#16161B] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-lg">
      {/* Prévia do arquivo */}
      <div className="relative aspect-[4/3] flex items-center justify-center p-5 bg-[#101014]">
        <div
          className="max-w-full max-h-full rounded-lg overflow-hidden"
          style={bg === 'transparent' ? CHECKER_STYLE : undefined}
        >
          <img
            src={preview}
                alt={`${logo.name}, fundo ${BACKGROUNDS.find((b) => b.id === bg)?.label.toLowerCase()}`}
            width={logo.width}
            height={logo.height}
            className="block max-w-full max-h-[240px] w-auto h-auto object-contain"
          />
        </div>
      </div>

      <div className="px-4 pt-3 flex items-center gap-1.5 text-[11px]" role="group" aria-label="Fundo da prévia">
        <span className="text-neutral-400 font-semibold mr-1">Ver com fundo:</span>
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBg(b.id)}
            aria-pressed={bg === b.id}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              bg === b.id ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="p-4 pb-3">
        <h3 className="text-base font-bold text-white">{logo.name}</h3>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{logo.description}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {logo.recommendedFor.map((item) => (
            <span key={item} className="text-[10px] font-medium bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Downloads */}
      <div className="mt-auto p-4 bg-neutral-950/60 border-t border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px]" role="group" aria-label="Tamanho do arquivo">
          <span className="text-neutral-400 font-semibold">
            Tamanho: {size} × {height} px
          </span>
          <div className="flex gap-1">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`px-2 py-1 rounded-md font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  size === s ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => downloadRaster('png-clear', 'transparent', 'image/png')}
          disabled={busy !== null}
          className="w-full bg-[#E60000] hover:bg-red-500 disabled:opacity-60 text-white font-extrabold text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Download className="w-4 h-4" />
          {busy === 'png-clear' ? 'Gerando…' : 'Baixar PNG transparente'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => downloadRaster('png-red', 'red', 'image/png')} disabled={busy !== null} className={secondary}>
            {busy === 'png-red' ? 'Gerando…' : 'PNG vermelho'}
          </button>
          <button onClick={() => downloadRaster('jpg-red', 'red', 'image/jpeg')} disabled={busy !== null} className={secondary}>
            {busy === 'jpg-red' ? 'Gerando…' : 'JPG vermelho'}
          </button>
          <button onClick={downloadSvg} disabled={busy !== null} className={secondary}>
            SVG vetor
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          onClick={() => onSelectForWatermark(logo.id)}
          className="w-full text-xs font-semibold text-neutral-300 hover:text-white py-1.5 flex items-center justify-center gap-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Colocar esta logo em uma foto
        </button>
      </div>
    </article>
  );
};
