export type LogoCategory = 'monogram' | 'watermark' | 'badge' | 'horizontal' | 'breaking' | 'original';

/** Fundo do arquivo: transparente (para fotos), vermelho da marca ou preto. */
export type LogoVariant = 'transparent' | 'red' | 'dark';

export interface LogoItem {
  id: string;
  /** Nome usado nos arquivos baixados. */
  fileName: string;
  name: string;
  category: LogoCategory;
  description: string;
  recommendedFor: string[];
  width: number;
  height: number;
  getSvgString: (variant: LogoVariant) => string;
  previewVariant: LogoVariant;
}

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface WatermarkSettings {
  selectedLogoId: string;
  variant: LogoVariant;
  position: WatermarkPosition;
  sizePercent: number;
  opacity: number;
  paddingPercent: number;
  bannerText: string;
  showBanner: boolean;
  bannerType: 'urgente' | 'aovivo' | 'exclusivo' | 'plantao';
}
