import React, { useState } from 'react';
import { Copy, Check, BookOpen, Smartphone, ShieldCheck, Palette, FileText } from 'lucide-react';

export const BrandGuide: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const colors = [
    {
      name: 'Vermelho Vacaria News',
      role: 'Cor Primária / Identidade',
      hex: '#FF0000',
      rgb: 'rgb(255, 0, 0)',
      cmyk: '0%, 100%, 100%, 0%',
      textColor: 'text-white'
    },
    {
      name: 'Preto Imprensa',
      role: 'Contornos e Textos',
      hex: '#000000',
      rgb: 'rgb(0, 0, 0)',
      cmyk: '0%, 0%, 0%, 100%',
      textColor: 'text-white'
    },
    {
      name: 'Branco Puro',
      role: 'Preenchimento de Letras',
      hex: '#FFFFFF',
      rgb: 'rgb(255, 255, 255)',
      cmyk: '0%, 0%, 0%, 0%',
      textColor: 'text-black'
    },
    {
      name: 'Cinza Noturno News',
      role: 'Fundos e Tarjas',
      hex: '#16161B',
      rgb: 'rgb(22, 22, 27)',
      cmyk: '19%, 19%, 0%, 89%',
      textColor: 'text-white'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      },
      () => {}
    );
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Manual de Aplicação da Marca
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Guia Prático: Como Incluir a Logo VN nas Suas Imagens
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-3xl">
          Instruções simples e diretas para aplicar os arquivos PNG transparente no seu celular, Canva, Photoshop ou CapCut.
        </p>
      </div>

      {/* Step by Step Tutorials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tutorial 1: No Celular (WhatsApp & Stories) */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Celular / Instagram Stories</h3>
            <ol className="text-xs text-neutral-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>Na aba <strong>Logos</strong>, toque em <strong>Baixar PNG transparente</strong>. O arquivo vai para a pasta Downloads; no iPhone, segure o dedo na imagem que aparece e toque em “Salvar em Fotos”.</li>
              <li>Abra o Instagram ou WhatsApp e escolha a foto da notícia que deseja postar.</li>
              <li>Toque no ícone de <strong>Adesivos / Stickers</strong> e selecione a opção de <strong>adicionar foto da galeria</strong>.</li>
              <li>Escolha o arquivo da logo VN (ele entrará sem nenhum fundo branco!).</li>
              <li>Posicione no canto superior ou inferior da imagem e publique.</li>
            </ol>
          </div>
          <div className="mt-5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
            Dica: salve o arquivo PNG em um álbum chamado "Marca VN" para encontrá-lo mais rapidamente.
          </div>
        </div>

        {/* Tutorial 2: No Canva */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Canva (Computador ou Celular)</h3>
            <ol className="text-xs text-neutral-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>Crie um novo post (ex: Post para Instagram 1080x1080).</li>
              <li>Vá no menu lateral esquerdo em <strong>Uploads</strong> e suba o arquivo <strong>vn-monograma-transparente-2000px.png</strong>.</li>
              <li>Adicione a foto da ocorrência ou notícia na tela.</li>
              <li>Clique na logo VN para inseri-la sobre a foto.</li>
              <li>Ajuste o tamanho e coloque em um dos quatro cantos.</li>
            </ol>
          </div>
          <div className="mt-5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
            Você pode deixar a logo salva na pasta de Marca do Canva para toda a equipe usar.
          </div>
        </div>

        {/* Tutorial 3: No CapCut / InShot (Para Vídeos) */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No CapCut / Edição de Vídeo</h3>
            <ol className="text-xs text-neutral-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>Abra o vídeo da reportagem na linha do tempo.</li>
              <li>Toque no botão <strong>Camada (Overlay)</strong> &gt; Adicionar Camada.</li>
              <li>Selecione o <strong>PNG Transparente da logo VN</strong>.</li>
              <li>Estique a faixa da logo para durar todo o tempo do vídeo.</li>
              <li>Diminua a opacidade para cerca de <strong>85%</strong> se preferir uma marca d'água mais sutil.</li>
            </ol>
          </div>
          <div className="mt-5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
            A marca ajuda a identificar a origem dos seus vídeos no TikTok e Reels.
          </div>
        </div>

      </div>

      {/* Instagram formats */}
      <div className="bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border border-red-900/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Quer um post inteiro pronto para o Instagram?</h3>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-2xl">
            Na aba <strong className="text-white">Criar</strong> a tarja VN + URGENTE +
            VACARIA NEWS já vem montada em 1080 × 1080 (feed quadrado), 1080 × 1350 (feed retrato) ou 1080 × 1920
            (Stories/Reels). É só escrever a manchete e baixar o PNG no tamanho certo.
          </p>
        </div>
      </div>

      {/* Official Color Palette */}
      <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Paleta de Cores Oficiais da Marca</h3>
            <p className="text-xs text-neutral-400">Use os códigos exatos para manter o padrão cromático em qualquer mídia impressa ou digital.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {colors.map((c, i) => (
            <div key={i} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
              <div
                className="h-24 w-full flex items-center justify-center font-mono font-bold text-sm relative"
                style={{ backgroundColor: c.hex }}
              >
                <span className={`${c.textColor} drop-shadow-md`}>{c.hex}</span>
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{c.name}</h4>
                  <p className="text-[10px] text-neutral-400">{c.role}</p>
                </div>
                <div className="text-[11px] font-mono text-neutral-400 space-y-0.5 pt-2 border-t border-neutral-800">
                  <div className="flex justify-between">
                    <span>RGB:</span>
                    <span className="text-neutral-200">{c.rgb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CMYK:</span>
                    <span className="text-neutral-200">{c.cmyk}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(c.hex)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
                >
                  {copiedCode === c.hex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar HEX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
