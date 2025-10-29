import { BoardAudioManager } from '../../src/core/BoardAudioManager';
import type { BoardSoundEventUrls } from '../../src/core/types';

type AudioMock = {
  play: jest.Mock<Promise<void>, []>;
  addEventListener: jest.Mock;
  preload: string;
  volume: number;
  currentTime: number;
};

type AudioConstructor = new (src?: string) => HTMLAudioElement;

describe('BoardAudioManager', () => {
  let originalAudio: AudioConstructor | undefined;
  let audioInstances: Record<string, AudioMock>;

  beforeEach(() => {
    audioInstances = {};
    originalAudio = globalThis.Audio as AudioConstructor | undefined;
    const audioFactory = jest.fn((src: string) => {
      const audio: AudioMock = {
        play: jest.fn().mockResolvedValue(undefined),
        addEventListener: jest.fn(),
        preload: 'auto',
        volume: 0.3,
        currentTime: 0,
      };
      audioInstances[src] = audio;
      return audio as unknown as HTMLAudioElement;
    });
    globalThis.Audio = audioFactory as unknown as AudioConstructor;
  });

  afterEach(() => {
    if (originalAudio) {
      globalThis.Audio = originalAudio;
    } else {
      Reflect.deleteProperty(
        globalThis as typeof globalThis & { Audio?: AudioConstructor },
        'Audio',
      );
    }
  });

  function createManager(
    options: Partial<{
      soundUrl: string;
      soundUrls: { white?: string; black?: string };
      soundEventUrls: BoardSoundEventUrls;
    }>,
  ): BoardAudioManager {
    const manager = new BoardAudioManager({
      enabled: true,
      soundUrl: options.soundUrl,
      soundUrls: options.soundUrls,
      soundEventUrls: options.soundEventUrls,
    });
    manager.initialize();
    return manager;
  }

  it('plays event-specific sounds for the matching color', () => {
    const manager = createManager({
      soundEventUrls: { capture: { white: 'white-capture.mp3' } },
    });

    const captureSound = audioInstances['white-capture.mp3'];
    expect(captureSound).toBeDefined();

    manager.playSound('capture', 'white');

    expect(captureSound.play).toHaveBeenCalledTimes(1);
    expect(captureSound.currentTime).toBe(0);
  });

  it('falls back to move sounds when the specific event is missing', () => {
    const manager = createManager({
      soundEventUrls: { move: 'move.mp3' },
    });

    const moveSound = audioInstances['move.mp3'];
    expect(moveSound).toBeDefined();

    manager.playSound('check', 'black');

    expect(moveSound.play).toHaveBeenCalledTimes(1);
  });

  it('falls back to global color sounds when no event clips exist', () => {
    const manager = createManager({
      soundUrls: { black: 'black-default.mp3' },
    });

    const blackSound = audioInstances['black-default.mp3'];
    expect(blackSound).toBeDefined();

    manager.playSound('checkmate', 'black');

    expect(blackSound.play).toHaveBeenCalledTimes(1);
  });

  it('loads and plays promotion and illegal event clips', () => {
    const manager = createManager({
      soundEventUrls: {
        promote: { white: 'white-promote.mp3' },
        illegal: 'illegal.mp3',
      },
    });

    const promoteSound = audioInstances['white-promote.mp3'];
    const illegalSound = audioInstances['illegal.mp3'];

    expect(promoteSound).toBeDefined();
    expect(illegalSound).toBeDefined();

    manager.playSound('promote', 'white');
    manager.playSound('illegal', 'black');

    expect(promoteSound.play).toHaveBeenCalledTimes(1);
    expect(illegalSound.play).toHaveBeenCalledTimes(1);
  });
});
