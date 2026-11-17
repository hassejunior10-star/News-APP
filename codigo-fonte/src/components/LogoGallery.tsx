import React, { useMemo, useState } from 'react';
import { Download, FileArchive, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { LogoItem, LogoVariant } from '../types';
import { LogoCard } from './LogoCard';
import { useDeliver } from './DownloadDialog';
import { svgDataUrl, svgToRaster } from '../utils/exportUtils';
import { CHECKER_STYLE } from '../utils/checker';

interface LogoGalleryProps {
  logos: LogoItem[];
  onSelectForWatermark: (logoId: string) => void;
  onDownloadAllZip: () => void;
  onOpenInstagram: () => void;
  isZipping: boolean;
}

export const LogoGallery: React.FC<LogoGalleryProps> = ({ logos, onSelectForWatermark, onDownloadAllZip, isZipping, onOpenInstagram }) => {
  const deliver = useDeliver();
  const main = logos[0];
  const [busy, setBusy] = useState<LogoVariant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearUrl = useMemo(() => svgDataUrl(main.getSvgString('transparent')), [main]);
  const redUrl = useMemo(() => svgDataUrl(main.getSvgString('red')), [main]);

  const quick = async (variant: LogoVariant) => {
    setBusy(variant);
    setError(null);
    try {
      const blob = await svgToRaster(main.getSvgString(variant), 2000, 2000, 'image/png');
      deliver(blob, `${main.fileName}-${variant === 'transparent' ? 'transparente' : 'fundo-vermelho'}-2000px.png`);
    } catch {
      setError('Não foi possível gerar o arquivo. Atualize a página e tente de novo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Download rápido */}
      <section className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-5 sm:p-8 shadow-2xl grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Logo <span className="text-red-500">VN</span> pronta para baixar
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
            Toque em um botão abaixo para baixar. Para colocar a marca por cima das suas fotos, use o{' '}
            <strong className="text-white">PNG transparente</strong>.
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <button
              onClick={() => quick('transparent')}
              disabled={busy !== null}
              className="bg-[#E60000] hover:bg-red-500 disabled:opacity-60 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Download className="w-4 h-4" />
              {busy === 'transparent' ? 'Gerando…' : 'PNG transparente'}
            </button>
            <button
              onClick={() => quick('red')}
              disabled={busy !== null}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 border border-neutral-600 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Download className="w-4 h-4" />
              {busy === 'red' ? 'Gerando…' : 'PNG fundo vermelho'}
            </button>
            <button
              onClick={onDownloadAllZip}
              disabled={isZipping}
              className="sm:col-span-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 border border-neutral-600 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FileArchive className="w-4 h-4" />
              {isZipping ? 'Gerando o pacote…' : 'Todos os modelos e formatos (.zip)'}
            </button>
            <button
              onClick={onOpenInstagram}
              className="sm:col-span-2 bg-red-950/50 hover:bg-red-900/60 border border-red-700/60 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Quer um post completo para o Instagram? Criar post →
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <p className="mt-4 flex gap-2.5 text-xs text-neutral-400 leading-relaxed">
            <FolderOpen className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>
              O arquivo é salvo na pasta <strong className="text-neutral-200">Downloads</strong> do seu aparelho. Depois de
              cada download abre uma janela com a imagem e o caminho para encontrá-la no computador, no Android e no
              iPhone.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <figure>
            <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-700" style={CHECKER_STYLE}>
              <img src={clearUrl} alt="Logo VN com fundo transparente" className="w-full h-full object-contain" />
            </div>
            <figcaption className="mt-2 text-center text-xs text-neutral-400">Transparente (para fotos)</figcaption>
          </figure>
          <figure>
            <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-700">
              <img src={redUrl} alt="Logo VN com fundo vermelho" className="w-full h-full object-contain" />
            </div>
            <figcaption className="mt-2 text-center text-xs text-neutral-400">Fundo vermelho (perfil)</figcaption>
          </figure>
        </div>
      </section>

      {/* Todos os modelos */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Todos os modelos</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Cada modelo pode ser baixado em PNG transparente, PNG ou JPG com fundo vermelho e SVG (vetor para gráfica).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logos.map((logo) => (
            <LogoCard key={logo.id} logo={logo} onSelectForWatermark={onSelectForWatermark} />
          ))}
        </div>
      </section>

      <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Prefere receber a foto já com a marca?</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Envie a foto, escolha o canto e o tamanho da logo e baixe a imagem pronta.
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectForWatermark(main.id)}
          className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl border border-neutral-700 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Abrir aplicador de fotos
        </button>
      </section>
    </div>
  );
};
