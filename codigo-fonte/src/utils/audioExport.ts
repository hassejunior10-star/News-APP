import { Mp3Encoder } from '@breezystack/lamejs';

export type SfxKind = 'none' | 'impact' | 'whoosh' | 'urgente' | 'chime';

/** Sintetiza efeitos sonoros de rádio diretamente na Web Audio API (offline). */
export function scheduleSfx(
  ctx: BaseAudioContext,
  destination: AudioNode,
  kind: SfxKind,
  startTime: number,
  volume = 0.65
): number {
  if (kind === 'none') return 0;

  const gain = ctx.createGain();
  gain.connect(destination);

  if (kind === 'impact') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, startTime);
    osc.frequency.exponentialRampToValueAtTime(36, startTime + 0.55);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
    osc.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + 0.62);
    return 0.6;
  }

  if (kind === 'whoosh') {
    const duration = 0.55;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.5;
    filter.frequency.setValueAtTime(300, startTime);
    filter.frequency.exponentialRampToValueAtTime(3400, startTime + duration * 0.65);
    filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);

    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.85, startTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    noise.start(startTime);
    noise.stop(startTime + duration);
    return duration;
  }

  if (kind === 'urgente') {
    const freqs = [880, 1174.66, 880];
    freqs.forEach((f, i) => {
      const t = startTime + i * 0.16;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(volume * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g);
      g.connect(destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
    return 0.52;
  }

  // chime
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const t = startTime + i * 0.1;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g);
    g.connect(destination);
    osc.start(t);
    osc.stop(t + 0.36);
  });
  return 0.65;
}

export interface MixOptions {
  voiceBuffer: AudioBuffer;
  musicBuffer: AudioBuffer | null;
  voiceVolume: number;
  musicVolume: number;
  radioVoiceFx: boolean;
  introSfx: SfxKind;
  outroSfx: SfxKind;
}

export async function renderMixToMp3(opts: MixOptions): Promise<Blob> {
  const sampleRate = 44100;
  const introOffset = opts.introSfx === 'none' ? 0 : 0.45;
  const outroExtra = opts.outroSfx === 'none' ? 0.25 : 0.85;
  const totalDuration = Math.max(1, introOffset + opts.voiceBuffer.duration + outroExtra);
  const length = Math.ceil(totalDuration * sampleRate);

  const offline = new OfflineAudioContext(1, length, sampleRate);

  // Voz
  const voiceSrc = offline.createBufferSource();
  voiceSrc.buffer = opts.voiceBuffer;
  const voiceGain = offline.createGain();
  voiceGain.gain.value = opts.voiceVolume;

  if (opts.radioVoiceFx) {
    const highpass = offline.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 95;

    const presence = offline.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3200;
    presence.Q.value = 1.1;
    presence.gain.value = 4.5;

    const comp = offline.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.15;

    voiceSrc.connect(highpass);
    highpass.connect(presence);
    presence.connect(comp);
    comp.connect(voiceGain);
  } else {
    voiceSrc.connect(voiceGain);
  }
  voiceGain.connect(offline.destination);
  voiceSrc.start(introOffset);

  // Trilha de fundo
  if (opts.musicBuffer) {
    const musicSrc = offline.createBufferSource();
    musicSrc.buffer = opts.musicBuffer;
    musicSrc.loop = true;
    const musicGain = offline.createGain();
    musicGain.gain.setValueAtTime(opts.musicVolume, 0);
    musicGain.gain.setValueAtTime(opts.musicVolume, Math.max(0, totalDuration - 0.5));
    musicGain.gain.linearRampToValueAtTime(0.001, totalDuration);
    musicSrc.connect(musicGain);
    musicGain.connect(offline.destination);
    musicSrc.start(0);
    musicSrc.stop(totalDuration);
  }

  // Efeitos de entrada e saída
  if (opts.introSfx !== 'none') {
    scheduleSfx(offline, offline.destination, opts.introSfx, 0, 0.7);
  }
  if (opts.outroSfx !== 'none') {
    scheduleSfx(offline, offline.destination, opts.outroSfx, introOffset + opts.voiceBuffer.duration + 0.05, 0.7);
  }

  const rendered = await offline.startRendering();
  return encodeAudioBufferToMp3(rendered);
}

function encodeAudioBufferToMp3(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const encoder = new Mp3Encoder(1, sampleRate, 128);
  const blockSize = 1152;
  const mp3Data: BlobPart[] = [];

  for (let i = 0; i < int16.length; i += blockSize) {
    const chunk = int16.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
  }
  const endBuf = encoder.flush();
  if (endBuf.length > 0) mp3Data.push(new Uint8Array(endBuf));

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
