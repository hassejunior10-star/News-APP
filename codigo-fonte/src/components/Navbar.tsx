import { ArrowUpRight, BookOpen, Captions, CircleHelp, CircleUserRound, Images, Layers3, Palette, PenLine, Radio, Smartphone, Sparkles } from 'lucide-react';
import { BRAND_ICON } from '../data/brand';

export type Tab = 'identity' | 'client-logos' | 'radio' | 'profiles' | 'instagram' | 'gc' | 'gallery' | 'watermark' | 'mockups' | 'guide';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onInstall: () => void;
  installed: boolean;
}

const TABS = [
  { id: 'identity', label: 'Novas logos', mobile: 'Logos', Icon: Sparkles },
  { id: 'client-logos', label: 'Logomarcas', mobile: 'Marcas', Icon: Palette },
  { id: 'radio', label: 'Estúdio de Rádio', mobile: 'Rádio', Icon: Radio },
  { id: 'profiles', label: 'Fotos de perfil', mobile: 'Perfil', Icon: CircleUserRound },
  { id: 'instagram', label: 'Criar publicação', mobile: 'Criar', Icon: PenLine },
  { id: 'gc', label: 'GC de entrevista', mobile: 'GC', Icon: Captions },
  { id: 'gallery', label: 'Logos anteriores', mobile: 'Antigas', Icon: Layers3 },
  { id: 'watermark', label: "Marca d'água", mobile: 'Foto', Icon: Images },
  { id: 'mockups', label: 'Inspiração', mobile: 'Ideias', Icon: BookOpen },
  { id: 'guide', label: 'Como usar', mobile: 'Ajuda', Icon: CircleHelp },
] as const;

export function Navbar({ activeTab, setActiveTab, onInstall, installed }: NavbarProps) {
  return (
    <>
      <aside className="app-sidebar">
        <button className="brand-lockup" onClick={() => setActiveTab('identity')} aria-label="VN Studio, página inicial">
          <img src={BRAND_ICON} alt="" />
          <span><strong>VACARIA NEWS</strong><small>ESTÚDIO CRIATIVO</small></span>
        </button>
        <div className="sidebar-divider" />
        <p className="sidebar-label">SEU ESPAÇO</p>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>CRIE DE ONDE ESTIVER</p>
          <button className="sidebar-install" onClick={onInstall}>
            <span className="sidebar-install-icon"><Smartphone size={18} /></span>
            <span><strong>{installed ? 'App instalado' : 'Leve o VN no celular'}</strong><small>{installed ? 'Pronto para usar' : 'Adicionar à tela inicial'}</small></span>
            <ArrowUpRight className="sidebar-arrow" size={16} />
          </button>
          <span className="sidebar-signature">FEITO PARA A SUA NOTÍCIA.</span>
        </div>
      </aside>

      <header className="mobile-header">
        <button className="brand-lockup" onClick={() => setActiveTab('identity')} aria-label="VN Studio, página inicial">
          <img src={BRAND_ICON} alt="" />
          <span><strong>VACARIA NEWS</strong><small>ESTÚDIO CRIATIVO</small></span>
        </button>
        <button className="mobile-install" onClick={onInstall}>
          <Smartphone size={15} /> {installed ? 'Instalado' : 'Instalar'}
        </button>
      </header>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {TABS.filter((tab) => tab.id !== 'mockups' && tab.id !== 'gallery').map(({ id, mobile, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}>
            <Icon size={20} strokeWidth={activeTab === id ? 2.1 : 1.7} />
            <span>{mobile}</span>
          </button>
        ))}
      </nav>
    </>
  );
}