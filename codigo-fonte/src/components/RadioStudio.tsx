import { useEffect, useRef, useState } from 'react';
import { Download, Mic, Music, Play, Radio, RotateCcw, Square, Upload, Volume2 } from 'lucide-react';
import { renderMixToMp3, scheduleSfx, type SfxKind } from '../utils/audioExport';
import { useDeliver } from './DownloadDialog';

const SFX_OPTIONS: { id: SfxKind; label: string }[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'impact', label: 'Impacto' },
  { id: 'whoosh', label: 'Whoosh' },
  { id: 'urgente', label: 'Plantão' },
  { id: 'chime', label: 'Vinheta' },
];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RadioStudio() {
  const deliver = useDeliver();
  const [title, setTitle] = useState('comercial-vacaria-news');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');

  const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

  const [musicName, setMusicName] = useState('');
  const [musicBuffer, setMusicBuffer] = useState<AudioBuffer | null>(null);

  const [voiceVolume, setVoiceVolume] = useState(1.1);
  const [musicVolume, setMusicVolume] = useState(0.22);
  const [radioVoiceFx, setRadioVoiceFx] = useState(true);
  const [introSfx, setIntroSfx] = useState<SfxKind>('whoosh');
  const [outroSfx, setOutroSfx] = useState<SfxKind>('impact');
  const [isExporting, setIsExporting] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    };
  }, [voiceUrl]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setLevel(0);
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        try {
          const arrayBuf = await blob.arrayBuffer();
          const decoded = await getAudioContext().decodeAudioData(arrayBuf);
          setVoiceBuffer(decoded);
        } catch {
          setError('Não foi possível processar o áudio gravado neste navegador.');
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError('Permita o acesso ao microfone para gravar sua locução.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleMusicUpload = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const arrayBuf = await file.arrayBuffer();
      const decoded = await getAudioContext().decodeAudioData(arrayBuf);
      setMusicBuffer(decoded);
      setMusicName(file.name);
    } catch {
      setError('Formato de trilha não suportado. Use MP3, WAV ou M4A.');
    }
  };

  const previewSfx = (kind: SfxKind) => {
    if (kind === 'none') return;
    const ctx = getAudioContext();
    scheduleSfx(ctx, ctx.destination, kind, ctx.currentTime + 0.02, 0.7);
  };

  const handleExportMp3 = async () => {
    if (!voiceBuffer || isExporting) return;
    setIsExporting(true);
    setError('');
    try {
      const mp3Blob = await renderMixToMp3({
        voiceBuffer,
        musicBuffer,
        voiceVolume,
        musicVolume,
        radioVoiceFx,
        introSfx,
        outroSfx,
      });
      const safeName =
        title
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-_]+/g, '-')
          .replace(/^-|-$/g, '') || 'comercial-vn';
      deliver(mp3Blob, `${safeName}.mp3`);
    } catch {
      setError('Erro ao gerar o MP3. Tente gravar novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setVoiceBuffer(null);
    setVoiceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMusicBuffer(null);
    setMusicName('');
    setVoiceVolume(1.1);
    setMusicVolume(0.22);
    setRadioVoiceFx(true);
    setIntroSfx('whoosh');
    setOutroSfx('impact');
    setRecordSeconds(0);
    setError('');
  };

  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <p className="studio-eyebrow"><span />ESTÚDIO DE RÁDIO</p>
          <h1>Vinhetas &amp; <span>Comerciais</span></h1>
          <p>Grave sua locução, adicione trilha sonora e efeitos de rádio, e baixe tudo mixado em MP3.</p>
        </div>
      </div>

      {error && <p role="alert" className="workspace-error">{error}</p>}

      <div className="editor-grid">
        <div>
          <div className="section-heading preview-heading">
            <div>
              <p className="section-kicker">GRAVAÇÃO <span>/</span> MICROFONE</p>
              <h2>Estúdio de locução</h2>
            </div>
            <div className="live-label">
              <span style={{ background: isRecording ? '#ef4444' : '#52525b' }} />
              {isRecording ? 'GRAVANDO' : voiceBuffer ? 'PRONTO' : 'AGUARDANDO'}
            </div>
          </div>

          <div className="preview-stage flex-col gap-6 text-center" style={{ minHeight: 380 }}>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex h-24 w-24 items-center justify-center rounded-full border-2 transition ${
                  isRecording
                    ? 'animate-pulse border-red-400 bg-red-600 text-white shadow-lg shadow-red-600/40'
                    : 'border-zinc-700 bg-zinc-800 text-white hover:border-red-500 hover:bg-red-600/20'
                }`}
                aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
              >
                {isRecording ? <Square size={30} /> : <Mic size={34} />}
              </button>
              <div className="font-mono text-2xl font-bold text-white">{formatTime(recordSeconds)}</div>
              <p className="text-xs text-zinc-400">
                {isRecording
                  ? 'Clique no quadrado para finalizar a gravação'
                  : 'Clique no microfone para gravar sua voz'}
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                  style={{ width: `${level}%` }}
                />
              </div>
            </div>

            {voiceUrl && (
              <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                <p className="mb-2 text-left text-xs font-semibold text-zinc-400">Prévia da voz gravada:</p>
                <audio controls src={voiceUrl} className="w-full" />
              </div>
            )}
          </div>

          <div className="preview-footer">
            <div className="preview-file-info">
              <span className="file-icon"><Radio size={16} /></span>
              <span>
                <strong>{title || 'comercial-vn'}.mp3</strong>
                <small>
                  {voiceBuffer ? `${voiceBuffer.duration.toFixed(1)}s de voz` : 'Sem gravação'} <i /> MP3 128kbps
                </small>
              </span>
            </div>
            <button
              type="button"
              disabled={!voiceBuffer || isExporting}
              onClick={handleExportMp3}
              className="photo-shortcut"
              style={{
                background: voiceBuffer ? '#e91e29' : '#27272a',
                borderColor: voiceBuffer ? '#ff4850' : '#3f3f46',
                color: '#fff',
              }}
            >
              <Download size={15} /> {isExporting ? 'Gerando MP3...' : 'Baixar MP3'}
            </button>
          </div>
        </div>

        <aside className="edit-panel">
          <div className="edit-panel-heading">
            <div>
              <p className="section-kicker">MIXAGEM &amp; VINHETA</p>
              <h2>Configurar áudio</h2>
              <p>Adicione trilha de fundo, efeitos de rádio e vinhetas.</p>
            </div>
            <button type="button" className="reset-button" onClick={handleReset} title="Limpar estúdio" aria-label="Limpar estúdio">
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="editor-fields">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
              Nome do arquivo MP3
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={40}
                placeholder="Ex: comercial-loja-central"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Music size={13} /> Trilha de fundo (opcional)
              </span>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 px-3 py-2.5 text-xs text-zinc-300 hover:border-red-500">
                <span className="truncate">{musicName || 'Escolher música MP3 / WAV...'}</span>
                <Upload size={15} className="shrink-0 text-zinc-400" />
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleMusicUpload(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1"><Volume2 size={12} /> Voz: {Math.round(voiceVolume * 100)}%</span>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.05}
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(Number(e.target.value))}
                  className="accent-red-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1"><Music size={12} /> Trilha: {Math.round(musicVolume * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={0.8}
                  step={0.02}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="accent-red-500"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-200">
              <span>Efeito Locução de Rádio (voz encorpada)</span>
              <input
                type="checkbox"
                checked={radioVoiceFx}
                onChange={(e) => setRadioVoiceFx(e.target.checked)}
                className="h-4 w-4 accent-red-500"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Efeito de entrada (Vinheta)</span>
                {introSfx !== 'none' && (
                  <button
                    type="button"
                    onClick={() => previewSfx(introSfx)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                  >
                    <Play size={11} /> Testar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {SFX_OPTIONS.map((sfx) => (
                  <button
                    key={sfx.id}
                    type="button"
                    onClick={() => setIntroSfx(sfx.id)}
                    className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold transition ${
                      introSfx === sfx.id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sfx.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Efeito de saída</span>
                {outroSfx !== 'none' && (
                  <button
                    type="button"
                    onClick={() => previewSfx(outroSfx)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                  >
                    <Play size={11} /> Testar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {SFX_OPTIONS.map((sfx) => (
                  <button
                    key={sfx.id}
                    type="button"
                    onClick={() => setOutroSfx(sfx.id)}
                    className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold transition ${
                      outroSfx === sfx.id
                        ? 'border-red-500 bg-red-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sfx.label}
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
