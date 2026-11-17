import { useEffect, useRef, useState } from 'react';
import { Check, Download, MoreVertical, Share2, Smartphone, X } from 'lucide-react';
import { BRAND_ICON } from '../data/brand';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return { prompt, installed, clearPrompt: () => setPrompt(null) };
}

interface InstallDialogProps {
  open: boolean;
  onClose: () => void;
  prompt: InstallPromptEvent | null;
  installed: boolean;
  clearPrompt: () => void;
}

export function InstallDialog({ open, onClose, prompt, installed, clearPrompt }: InstallDialogProps) {
  const [platform, setPlatform] = useState<'android' | 'ios'>(() =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'android'
  );
  const [installError, setInstallError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const install = async () => {
    if (!prompt) return;
    setInstallError('');
    try {
      await prompt.prompt();
      await prompt.userChoice;
      clearPrompt();
    } catch {
      setInstallError('Não foi possível abrir a instalação automática. Siga as instruções abaixo.');
      clearPrompt();
    }
  };

  return (
    <div className="install-overlay" onClick={onClose}>
      <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="install-close" onClick={onClose} aria-label="Fechar">
          <X size={19} />
        </button>
        <div className="install-brand">
          <img src={BRAND_ICON} alt="" />
          <span><strong>VN Studio</strong><small>VACARIA NEWS</small></span>
        </div>
        <p className="install-eyebrow">SEU ESTÚDIO NO BOLSO</p>
        <h2 id="install-title">Leve o VN com você.</h2>
        <p className="install-intro">Adicione o aplicativo à tela inicial para criar suas publicações com mais praticidade.</p>

        {installed ? (
          <div className="install-success"><Check size={18} /> O VN Studio já está aberto como aplicativo.</div>
        ) : (
          <>
            {prompt && (
              <button className="install-primary" onClick={install}>
                <Download size={17} /> Instalar aplicativo
              </button>
            )}
            {installError && <p className="install-error" role="alert">{installError}</p>}
            <div className="install-divider"><span>OU FAÇA PELO CELULAR</span></div>
            <div className="install-tabs" role="group" aria-label="Escolha seu celular">
              <button aria-pressed={platform === 'android'} onClick={() => setPlatform('android')}>Android</button>
              <button aria-pressed={platform === 'ios'} onClick={() => setPlatform('ios')}>iPhone</button>
            </div>
            {platform === 'android' ? (
              <ol className="install-steps">
                <li><span>1</span><p>Abra este endereço no <strong>Chrome</strong> do seu celular.</p></li>
                <li><span>2</span><p>Toque em <MoreVertical size={15} className="inline-icon" /> <strong>Mais opções</strong> no canto superior.</p></li>
                <li><span>3</span><p>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p></li>
              </ol>
            ) : (
              <ol className="install-steps">
                <li><span>1</span><p>Abra este endereço no <strong>Safari</strong> do iPhone.</p></li>
                <li><span>2</span><p>Toque em <Share2 size={15} className="inline-icon" /> <strong>Compartilhar</strong>.</p></li>
                <li><span>3</span><p>Escolha <strong>Adicionar à Tela de Início</strong> e depois <strong>Adicionar</strong>.</p></li>
              </ol>
            )}
            <p className="install-note"><Smartphone size={16} /> É um aplicativo web. Para instalar, o site precisa estar em HTTPS. Instale antes de começar: o rascunho do navegador pode não passar para o app.</p>
          </>
        )}
        <button className="install-done" onClick={onClose}>Entendi</button>
      </section>
    </div>
  );
}