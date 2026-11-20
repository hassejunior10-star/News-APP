import { useCallback, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Navbar, Tab } from './components/Navbar';
import { LogoGallery } from './components/LogoGallery';
import { WatermarkStudio } from './components/WatermarkStudio';
import { MockupShowcase } from './components/MockupShowcase';
import { BrandGuide } from './components/BrandGuide';
import { InstagramStudio } from './components/InstagramStudio';
import { GcStudio } from './components/GcStudio';
import { IdentityStudio } from './components/IdentityStudio';
import { ClientLogoStudio } from './components/ClientLogoStudio';
import { ProfileGallery } from './components/ProfileGallery';
import { DownloadProvider, useDeliver } from './components/DownloadDialog';
import { InstallDialog, useInstallPrompt } from './components/InstallDialog';
import { LOGO_ITEMS } from './data/logos';
import { buildZip } from './utils/exportUtils';

const SECTION_NAMES: Record<Tab, string> = {
  identity: 'NOVAS LOGOS',
  'client-logos': 'CRIAR LOGOMARCAS',
  profiles: 'FOTOS DE PERFIL',
  instagram: 'CRIAR PUBLICAÇÃO',
  gc: 'GC DE ENTREVISTA',
  gallery: 'LOGOS VN',
  watermark: "MARCA D'ÁGUA",
  mockups: 'INSPIRAÇÃO',
  guide: 'COMO USAR',
};

function Shell() {
  const deliver = useDeliver();
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [selectedLogo, setSelectedLogo] = useState(LOGO_ITEMS[0].id);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; status: string } | null>(null);
  const [zipError, setZipError] = useState('');
  const [showInstall, setShowInstall] = useState(false);
  const { prompt, installed, clearPrompt } = useInstallPrompt();
  const closeInstall = useCallback(() => setShowInstall(false), []);

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectForWatermark = (logoId: string) => {
    setSelectedLogo(logoId);
    goTo('watermark');
  };

  const handleDownloadAllZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    setZipError('');
    setZipProgress({ percent: 0, status: 'Preparando as logos...' });
    try {
      const blob = await buildZip(LOGO_ITEMS, (percent, status) => setZipProgress({ percent, status }));
      deliver(blob, 'kit-logos-vn-vacaria-news.zip');
    } catch {
      setZipError('Não foi possível gerar o arquivo. Baixe os modelos um a um.');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={goTo} onInstall={() => setShowInstall(true)} installed={installed} />
      <div className="app-main">
        <div className="workspace-topbar">
          <p>VN STUDIO <span>/</span> <strong>{SECTION_NAMES[activeTab]}</strong></p>
          <button onClick={() => setShowInstall(true)}><Smartphone size={16} /> {installed ? 'Aplicativo instalado' : 'Instalar no celular'}</button>
        </div>

        <main className={`workspace-content ${activeTab !== 'instagram' && activeTab !== 'gc' ? 'support-content' : ''}`}>
          {zipError && <p role="alert" className="workspace-error">{zipError}</p>}
          {isZipping && zipProgress && (
            <div className="zip-status" role="status">
              <span>{zipProgress.status}</span><strong>{zipProgress.percent}%</strong>
            </div>
          )}

          <div className="editor-host" hidden={activeTab !== 'gc'}><GcStudio onOpenPost={() => goTo('instagram')} /></div>
          <div className="editor-host" hidden={activeTab !== 'instagram'}><InstagramStudio /></div>
          {activeTab === 'identity' && <IdentityStudio onOpenOldLogos={() => goTo('gallery')} />}
          {activeTab === 'client-logos' && <ClientLogoStudio />}
          {activeTab === 'profiles' && <ProfileGallery />}
          {activeTab === 'gallery' && (
            <LogoGallery
              logos={LOGO_ITEMS}
              onSelectForWatermark={handleSelectForWatermark}
              onDownloadAllZip={handleDownloadAllZip}
              isZipping={isZipping}
              onOpenInstagram={() => goTo('instagram')}
            />
          )}
          {activeTab === 'watermark' && <WatermarkStudio logos={LOGO_ITEMS} defaultSelectedLogoId={selectedLogo} />}
          {activeTab === 'mockups' && <MockupShowcase logos={LOGO_ITEMS} />}
          {activeTab === 'guide' && <BrandGuide />}
        </main>
        <footer className="app-footer"><span>VACARIA NEWS <i /> ESTÚDIO CRIATIVO</span><span>Feito para a sua notícia.</span></footer>
      </div>
      <InstallDialog open={showInstall} onClose={closeInstall} prompt={prompt} installed={installed} clearPrompt={clearPrompt} />
    </div>
  );
}

export function App() {
  return <DownloadProvider><Shell /></DownloadProvider>;
}

export default App;