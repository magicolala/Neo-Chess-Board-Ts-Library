import type { BoardOptions } from './types';

const DEFAULT_AUDIO_VOLUME = 0.3;

type Color = 'white' | 'black';

export interface BoardAudioConfig {
  enabled: boolean;
  soundUrl?: string;
  soundUrls?: BoardOptions['soundUrls'];
}

export class BoardAudioManager {
  private enabled: boolean;
  private soundUrl?: string;
  private soundUrls?: BoardOptions['soundUrls'];
  private moveSound: HTMLAudioElement | null = null;
  private moveSounds: Partial<Record<Color, HTMLAudioElement>> = {};

  constructor(config: BoardAudioConfig) {
    this.enabled = config.enabled;
    this.soundUrl = config.soundUrl;
    this.soundUrls = config.soundUrls;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.initialize();
    } else {
      this.clear();
    }
  }

  public setSoundUrl(soundUrl?: string): void {
    this.soundUrl = soundUrl;
    this.refresh();
  }

  public setSoundUrls(soundUrls?: BoardOptions['soundUrls']): void {
    this.soundUrls = soundUrls;
    this.refresh();
  }

  public initialize(): void {
    this.moveSound = null;
    this.moveSounds = {};

    if (!this.enabled || typeof Audio === 'undefined') {
      return;
    }

    const defaultUrl = this.soundUrl;
    const whiteUrl = this.soundUrls?.white;
    const blackUrl = this.soundUrls?.black;

    if (!defaultUrl && !whiteUrl && !blackUrl) {
      return;
    }

    if (whiteUrl) {
      const whiteSound = this.createAudioElement(whiteUrl);
      if (whiteSound) {
        this.moveSounds.white = whiteSound;
      }
    }

    if (blackUrl) {
      const blackSound = this.createAudioElement(blackUrl);
      if (blackSound) {
        this.moveSounds.black = blackSound;
      }
    }

    if (defaultUrl) {
      this.moveSound = this.createAudioElement(defaultUrl);
    }
  }

  public playMoveSound(nextTurn: 'w' | 'b'): void {
    if (!this.enabled) {
      return;
    }

    const movedColor: Color = nextTurn === 'w' ? 'black' : 'white';
    const sound = this.moveSounds[movedColor] ?? this.moveSound;

    if (!sound) {
      return;
    }

    try {
      sound.currentTime = 0;
      void sound.play().catch((error) => {
        console.debug('Sound not played:', error?.message ?? error);
      });
    } catch (error) {
      console.debug('Error playing sound:', error);
    }
  }

  public clear(): void {
    this.moveSound = null;
    this.moveSounds = {};
  }

  private refresh(): void {
    if (this.enabled) {
      this.initialize();
    } else {
      this.clear();
    }
  }

  private createAudioElement(url: string): HTMLAudioElement | null {
    try {
      const audio = new Audio(url);
      audio.volume = DEFAULT_AUDIO_VOLUME;
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        console.debug('Sound not available');
      });
      return audio;
    } catch (error) {
      console.warn('Unable to load move sound:', error);
      return null;
    }
  }
}
