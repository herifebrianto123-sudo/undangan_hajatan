/**
 * Dual-mode Javanese Wedding Audio Controller
 * Supports built-in Web Audio Slendro pentatonic gamelan chime or custom uploaded/URL audio.
 */

const SLENDRO_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const MELODY_SEQUENCE = [0, 2, 4, 5, 4, 2, 1, 3, 4, 2, 0, 1, 2, 4, 3, 1];

export function convertGDriveAudioUrl(url: string): string {
  if (!url) return '';
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://docs.google.com/uc?export=open&id=${fileMatch[1]}`;
  }
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://docs.google.com/uc?export=open&id=${idMatch[1]}`;
  }
  return url;
}

export class JavaneseAudioPlayer {
  private audioEl: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private step = 0;
  private playing = false;
  private useSynthFallback = true;
  private currentCustomUrl = '';

  constructor(mode: 'builtin' | 'custom' = 'builtin', customUrl = '') {
    this.setSource(mode, customUrl);
  }

  public setSource(mode: 'builtin' | 'custom', customUrl = ''): void {
    const resolved = mode === 'custom' ? convertGDriveAudioUrl(customUrl.trim()) : '';
    if (resolved === this.currentCustomUrl && ((resolved && !this.useSynthFallback) || (!resolved && this.useSynthFallback))) {
      return;
    }

    const wasPlaying = this.playing;
    if (wasPlaying) this.pause();

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }

    this.currentCustomUrl = resolved;

    if (mode === 'custom' && resolved) {
      this.audioEl = new Audio(resolved);
      this.audioEl.loop = true;
      this.audioEl.volume = 0.55;
      this.useSynthFallback = false;
      this.audioEl.addEventListener('error', () => {
        this.useSynthFallback = true;
        if (this.playing) this.startSynthLoop();
      });
    } else {
      this.useSynthFallback = true;
    }

    if (wasPlaying) {
      void this.play();
    }
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public async play(): Promise<boolean> {
    if (this.playing) return true;
    this.playing = true;

    if (!this.useSynthFallback && this.audioEl) {
      try {
        await this.audioEl.play();
        return true;
      } catch {
        this.useSynthFallback = true;
      }
    }

    this.startSynthLoop();
    return true;
  }

  public pause(): void {
    this.playing = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public async toggle(): Promise<boolean> {
    if (this.playing) {
      this.pause();
      return false;
    }
    await this.play();
    return true;
  }

  public destroy(): void {
    this.pause();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  private triggerGamelanTone(freq: number, duration = 2.4, volume = 0.08): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.002, now);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.18, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  private startSynthLoop(): void {
    if (this.timerId !== null) return;

    const playNext = () => {
      if (!this.playing) return;
      const noteIdx = MELODY_SEQUENCE[this.step % MELODY_SEQUENCE.length];
      const freq = SLENDRO_NOTES[noteIdx];
      this.triggerGamelanTone(freq, 2.5, 0.07);

      if (this.step % 4 === 0) {
        this.triggerGamelanTone(freq / 2, 3.8, 0.055);
      }
      this.step += 1;
    };

    playNext();
    this.timerId = window.setInterval(playNext, 1150);
  }
}
