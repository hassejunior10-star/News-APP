import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Download, FileArchive, FolderOpen, Monitor, Share2, Smartphone, X } from 'lucide-react';
import { CHECKER_STYLE } from '../utils/checker';
import { formatBytes } from '../utils/exportUtils';

type Deliver = (blob: Blob, filename: string) => void;

const DeliverContext = createContext<Deliver>(() => {});

/** Entrega um arquivo: inicia o download e abre a janela mostrando onde ele fica. */
export const useDeliver = () => useContext(DeliverContext);

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

interface Delivered {
  url: string;
  filename: string;
  blob: Blob;
}

const WHERE: { id: Platform; icon: React.ReactNode; title: string; text: string }[] = [
  {
    id: 'desktop',
    icon: <Monitor className="w-4 h-4" />,
    title: 'No computador',
    text: 'Pasta Downloads. No Chrome ou Edge, aperte Ctrl + J para ver a lista de downloads.',
  },
  {
    id: 'android',
    icon: <Smartphone className="w-4 h-4" />,
    title: 'No Android',
    text: 'App Arquivos (ou Files) → Downloads. Na Galeria, costuma aparecer no álbum Download.',
  },
  {
    id: 'ios',
    icon: <Smartphone className="w-4 h-4" />,
    title: 'No iPhone',
    text: 'App Arquivos → Downloads. Para mandar para o app Fotos, segure o dedo na imagem acima e toque em “Salvar em Fotos”.',
  },
];

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<Delivered | null>(null);
  const [shareable, setShareable] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const platform = useRef<Platform>(detectPlatform()).current;

  const deliver = useCallback<Deliver>((blob, filename) => {
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { url, filename, blob };
    });

    let canShare = false;
    try {
      const probe = new File([blob], filename, { type: blob.type });
      canShare = !!navigator.canShare && navigator.canShare({ files: [probe] });
    } catch {
      canShare = false;
    }
    setShareable(canShare);
  }, []);

  const close = useCallback(() => {
    setFile((prev) => {
      // Dá tempo de um download em andamento terminar antes de liberar a memória.
      if (prev) setTimeout(() => URL.revokeObjectURL(prev.url), 15000);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!file) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, close]);

  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [new File([file.blob], file.filename, { type: file.blob.type })] });
    } catch {
      /* usuário cancelou */
    }
  };

  const isImage = !!file && file.blob.type.startsWith('image/');
  const order = [...WHERE].sort((a, b) => Number(b.id === platform) - Number(a.id === platform));

  return (
    <DeliverContext.Provider value={deliver}>
      {children}

      {file && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#16161B] border border-neutral-700 rounded-t-3xl sm:rounded-3xl shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 p-5 pb-3">
              <div className="min-w-0">
                <h2 id="download-title" className="text-lg font-extrabold text-white">
                  Seu arquivo está pronto
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  <span className="break-all">{file.filename}</span>{' '}
                  <span className="whitespace-nowrap">· {formatBytes(file.blob.size)}</span>
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={close}
                aria-label="Fechar"
                className="shrink-0 w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 space-y-4 pb-5">
              {isImage ? (
                <div className="rounded-2xl overflow-hidden border border-neutral-700 p-4" style={CHECKER_STYLE}>
                  <img src={file.url} alt={file.filename} className="mx-auto max-h-52 w-auto max-w-full object-contain" />
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-6 flex items-center justify-center gap-3 text-neutral-200">
                  <FileArchive className="w-8 h-8 text-red-500" />
                  <span className="text-sm font-semibold">Arquivo compactado (.zip)</span>
                </div>
              )}

              <p className="text-sm text-neutral-300 leading-relaxed">
                O download começa sozinho. Se nada aconteceu, toque em <strong className="text-white">Baixar arquivo</strong>
                {isImage && (
                  <>
                    {' '}
                    ou segure o dedo (no computador, botão direito) sobre a imagem acima e escolha{' '}
                    <strong className="text-white">Salvar imagem</strong>
                  </>
                )}
                .
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={file.url}
                  download={file.filename}
                  className="flex-1 bg-[#E60000] hover:bg-red-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Download className="w-4 h-4" />
                  Baixar arquivo
                </a>
                {shareable && (
                  <button
                    onClick={share}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Share2 className="w-4 h-4" />
                    Salvar / Compartilhar
                  </button>
                )}
              </div>

              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-red-500" />
                  Onde o arquivo fica
                </h3>
                <ul className="space-y-2.5">
                  {order.map((w) => (
                    <li
                      key={w.id}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        w.id === platform ? 'text-neutral-100' : 'text-neutral-400'
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${w.id === platform ? 'text-red-400' : 'text-neutral-500'}`}>
                        {w.icon}
                      </span>
                      <span>
                        <strong className="font-bold">{w.title}:</strong> {w.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DeliverContext.Provider>
  );
};
