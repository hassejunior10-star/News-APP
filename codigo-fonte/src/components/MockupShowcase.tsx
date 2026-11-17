import React from 'react';
import { Camera, Radio, Smartphone, Award, Shield, CheckCircle } from 'lucide-react';
import { LogoItem } from '../types';

interface MockupShowcaseProps {
  logos: LogoItem[];
}

export const MockupShowcase: React.FC<MockupShowcaseProps> = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Camera className="w-3.5 h-3.5" />
          Aplicações Reais da Nova Marca VN
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Como sua Logo se Destaca no Mundo Real
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-3xl">
          Veja a presença da marca <strong>Vacaria News</strong> em coberturas jornalísticas, transmissões de rua, microfones de entrevista e redes sociais.
        </p>
      </div>

      {/* Grid of Mockups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Mockup 1: Cubo de Microfone de Reportagem */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between group hover:border-neutral-700 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4" /> Cubo de Microfone
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-semibold">
                Reportagem de Rua
              </span>
            </div>

            {/* Simulated 3D Microphone Cube */}
            <div className="aspect-square bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden p-6 shadow-inner">
              {/* Mic foam top */}
              <div className="w-24 h-28 bg-neutral-800 rounded-t-full border-2 border-neutral-700/80 shadow-2xl relative z-0 flex items-center justify-center">
                <div className="w-full h-full opacity-30 bg-[radial-gradient(#555_1px,transparent_1px)] [background-size:4px_4px]" />
              </div>

              {/* The VN Cube (Cubo de Microfone) */}
              <div className="relative z-10 -mt-2 w-36 h-36 bg-[#E60000] rounded-xl shadow-2xl border-4 border-black/40 flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <span className="font-['Alfa_Slab_One'] text-5xl text-white tracking-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                  VN
                </span>
                <span className="text-[10px] font-['Montserrat'] font-black text-black tracking-widest mt-1 bg-white px-2 py-0.5 rounded-sm uppercase">
                  Vacaria News
                </span>
              </div>

              {/* Mic Handle */}
              <div className="w-12 h-20 bg-gradient-to-b from-neutral-800 to-neutral-950 rounded-b-xl border border-neutral-700 shadow-xl" />
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-base font-bold text-white">Cubo de Microfone Profissional</h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Formato quadrado projetado para a fabricação do cubo de espuma/acrílico para entrevistas em campo e transmissões ao vivo.
            </p>
          </div>
        </div>

        {/* Mockup 2: Feed do Instagram */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between group hover:border-neutral-700 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Instagram Feed
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-semibold">
                Post com Marca d'Água
              </span>
            </div>

            {/* Instagram Post Mockup */}
            <div className="aspect-square bg-black rounded-2xl border border-neutral-800 overflow-hidden flex flex-col">
              {/* Instagram header */}
              <div className="p-3 bg-neutral-900 flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E60000] flex items-center justify-center font-['Alfa_Slab_One'] text-xs text-white border border-red-400">
                    VN
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white leading-none">vacarianews</span>
                      <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400" />
                    </div>
                    <span className="text-[9px] text-neutral-400">Vacaria, RS</span>
                  </div>
                </div>
                <span className="text-neutral-500 font-bold text-sm">•••</span>
              </div>

              {/* Photo with VN watermark */}
              <div className="relative flex-1 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/12777394/pexels-photo-12777394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=600"
                  alt="Post Vacaria News"
                  className="w-full h-full object-cover"
                />
                
                {/* Watermark in bottom right */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm border border-white/20 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <span className="font-['Alfa_Slab_One'] text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    VN
                  </span>
                  <div className="border-l border-white/40 pl-2">
                    <span className="block text-[8px] font-black text-white uppercase tracking-wider leading-none">
                      VACARIA NEWS
                    </span>
                    <span className="block text-[7px] text-red-400 font-bold uppercase leading-tight">
                      Furo Oficial
                    </span>
                  </div>
                </div>

                {/* Breaking tag */}
                <div className="absolute top-3 left-3 bg-[#E60000] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                  URGENTE
                </div>
              </div>

              {/* Engagement bar */}
              <div className="p-2.5 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-bold text-white">984 curtidas</span>
                <span className="text-[10px]">Ver todos os 72 comentários</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-base font-bold text-white">Post no Feed &amp; Notícia Rápida</h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              A marca d'água posicionada estrategicamente protege sua exclusividade jornalística e gera reconhecimento imediato do portal.
            </p>
          </div>
        </div>

        {/* Mockup 3: Crachá de Imprensa Oficial */}
        <div className="bg-[#16161B] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between group hover:border-neutral-700 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Credencial Oficial
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-semibold">
                Crachá de Imprensa
              </span>
            </div>

            {/* Press Badge Mockup */}
            <div className="aspect-square bg-gradient-to-br from-neutral-900 to-black rounded-2xl border border-neutral-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              {/* Lanyard connector */}
              <div className="w-14 h-4 bg-neutral-700 rounded-full mb-2 border border-neutral-600 shadow" />

              {/* Badge Card */}
              <div className="w-56 bg-neutral-900 border-2 border-red-600/70 rounded-2xl p-4 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-full bg-[#E60000] text-white text-[9px] font-black uppercase py-1 rounded mb-3 tracking-widest flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> IMPRENSA OFICIAL
                </div>

                <div className="w-16 h-16 rounded-xl bg-[#E60000] flex items-center justify-center font-['Alfa_Slab_One'] text-3xl text-white shadow-lg border border-red-400 mb-2">
                  VN
                </div>

                <span className="font-['Alfa_Slab_One'] text-sm text-white">VACARIA NEWS</span>
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                  Equipe de Reportagem
                </span>

                <div className="w-full border-t border-neutral-800 mt-3 pt-2 flex items-center justify-between text-[9px] text-neutral-400 font-mono">
                  <span>REGISTRO: #VN-2026</span>
                  <span className="text-emerald-400 font-bold">ATIVO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-base font-bold text-white">Credencial de Jornalista</h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              O monograma VN dá autoridade institucional à equipe em coberturas na câmara, delegacias, eventos e solenidades de Vacaria e região.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
