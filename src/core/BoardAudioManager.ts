import type { BoardOptions, BoardSoundEventType, BoardSoundEventUrls } from './types';

const DEFAULT_AUDIO_VOLUME = 0.3;

type Color = 'white' | 'black';

const SOUND_EVENT_TYPES: readonly BoardSoundEventType[] = [
  'move',
  'capture',
  'check',
  'checkmate',
  'promote',
  'illegal',
] as const;

const isBoardSoundEventType = (value: string): value is BoardSoundEventType =>
  (SOUND_EVENT_TYPES as readonly string[]).includes(value);

type LoadedSoundMap = {
  default?: HTMLAudioElement;
  byColor?: Partial<Record<Color, HTMLAudioElement>>;
};

const SOUND_EVENT_FALLBACK: Record<BoardSoundEventType, BoardSoundEventType[]> = {
  move: ['move'],
  capture: ['capture', 'move'],
  check: ['check', 'move'],
  checkmate: ['checkmate', 'check', 'move'],
  promote: ['promote', 'move'],
  illegal: ['illegal', 'move'],
};

export interface BoardAudioConfig {
  enabled: boolean;
  soundUrl?: string;
  soundUrls?: BoardOptions['soundUrls'];
  soundEventUrls?: BoardSoundEventUrls;
}

export class BoardAudioManager {
  private enabled: boolean;
  private soundUrl?: string;
  private soundUrls?: BoardOptions['soundUrls'];
  private soundEventUrls?: BoardSoundEventUrls;
  private defaultSound: HTMLAudioElement | null = null;
  private defaultColorSounds: Partial<Record<Color, HTMLAudioElement>> = {};
  private eventSounds: Partial<Record<BoardSoundEventType, LoadedSoundMap>> = {};

  constructor(config: BoardAudioConfig) {
    this.enabled = config.enabled;
    this.soundUrl = config.soundUrl;
    this.soundUrls = config.soundUrls;
    this.soundEventUrls = config.soundEventUrls;
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

  public setSoundEventUrls(soundEventUrls?: BoardSoundEventUrls): void {
    this.soundEventUrls = soundEventUrls;
    this.refresh();
  }

  public initialize(): void {
    this.clear();

    if (!this.enabled || typeof Audio === 'undefined') {
      return;
    }

    this.loadDefaultSounds();
    this.loadEventSounds();
  }

  public playSound(eventType: BoardSoundEventType, activeColor: Color): void {
    if (!this.enabled) {
      return;
    }

    const searchOrder = SOUND_EVENT_FALLBACK[eventType] ?? ['move'];

    for (const type of searchOrder) {
      const collection = this.eventSounds[type];
      const colorSound = collection?.byColor?.[activeColor];
      if (colorSound) {
        this.playAudioElement(colorSound);
        return;
      }
      if (collection?.default) {
        this.playAudioElement(collection.default);
        return;
      }
    }

    const fallbackColorSound = this.defaultColorSounds[activeColor];
    if (fallbackColorSound) {
      this.playAudioElement(fallbackColorSound);
      return;
    }

    if (this.defaultSound) {
      this.playAudioElement(this.defaultSound);
    }
  }

  public playMoveSound(nextTurn: 'w' | 'b'): void {
    const movedColor: Color = nextTurn === 'w' ? 'black' : 'white';
    this.playSound('move', movedColor);
  }

  public clear(): void {
    this.defaultSound = null;
    this.defaultColorSounds = {};
    this.eventSounds = {};
  }

  private refresh(): void {
    if (this.enabled) {
      this.initialize();
    } else {
      this.clear();
    }
  }

  private loadDefaultSounds(): void {
    if (this.soundUrl) {
      const sound = this.createAudioElement(this.soundUrl);
      if (sound) {
        this.defaultSound = sound;
      }
    }

    const whiteUrl = this.soundUrls?.white;
    const blackUrl = this.soundUrls?.black;

    if (whiteUrl) {
      const sound = this.createAudioElement(whiteUrl);
      if (sound) {
        this.defaultColorSounds.white = sound;
      }
    }

    if (blackUrl) {
      const sound = this.createAudioElement(blackUrl);
      if (sound) {
        this.defaultColorSounds.black = sound;
      }
    }
  }

  private loadEventSounds(): void {
    if (!this.soundEventUrls) {
      return;
    }

    for (const [eventKey, url] of Object.entries(this.soundEventUrls)) {
      this.addEventSound(eventKey, url);
    }
  }

  private playAudioElement(sound: HTMLAudioElement): void {
    try {
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.debug('Sound not played:', error?.message ?? error);
      });
    } catch (error) {
      console.debug('Error playing sound:', error);
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

  private addEventSound(eventKey: string, url?: BoardSoundEventUrls[BoardSoundEventType]): void {
    if (!url || !isBoardSoundEventType(eventKey)) {
      return;
    }

    const collection = this.buildEventSoundMap(url);
    if (collection) {
      this.eventSounds[eventKey] = collection;
    }
  }

  private buildEventSoundMap(url: BoardSoundEventUrls[BoardSoundEventType]): LoadedSoundMap | null {
    if (!url) {
      return null;
    }

    if (typeof url === 'string') {
      return this.buildDefaultEventSound(url);
    }

    return this.buildColorEventSound(url);
  }

  private buildDefaultEventSound(url: string): LoadedSoundMap | null {
    const sound = this.createAudioElement(url);
    return sound ? { default: sound } : null;
  }

  private buildColorEventSound(urls: Partial<Record<Color, string>>): LoadedSoundMap | null {
    const colorSounds: Partial<Record<Color, HTMLAudioElement>> = {};
    let hasColorSound = false;

    hasColorSound = this.tryAddColorSound(colorSounds, 'white', urls.white) || hasColorSound;
    hasColorSound = this.tryAddColorSound(colorSounds, 'black', urls.black) || hasColorSound;

    return hasColorSound ? { byColor: colorSounds } : null;
  }

  private tryAddColorSound(
    target: Partial<Record<Color, HTMLAudioElement>>,
    color: Color,
    url?: string,
  ): boolean {
    if (!url) {
      return false;
    }

    const sound = this.createAudioElement(url);
    if (!sound) {
      return false;
    }

    target[color] = sound;
    return true;
  }
}

export { type BoardSoundEventType } from './types';
