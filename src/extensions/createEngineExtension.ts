import { StockfishEngine } from '../engine/StockfishEngine';
import type { EngineAnalysisResult, EngineCreateOptions } from '../engine/types';
import type { ExtensionConfig, ExtensionContext } from '../core/types';

export interface EngineExtensionOptions {
  readonly engine?: EngineCreateOptions;
  readonly autoStart?: boolean;
  readonly depth?: number;
  readonly movetimeMs?: number;
  readonly multiPv?: number;
  readonly onResult?: (result: EngineAnalysisResult) => void;
  readonly onError?: (error: Error) => void;
  readonly onReady?: (engine: StockfishEngine) => void;
}

export interface EngineExtensionConfig extends EngineExtensionOptions {
  readonly id?: string;
}

export function createEngineExtension(
  config: EngineExtensionConfig = {},
): ExtensionConfig<EngineExtensionOptions> {
  const { id, ...options } = config;
  return {
    id: id ?? 'engine-analysis',
    options,
    create(_context: ExtensionContext<EngineExtensionOptions>) {
      const engine = new StockfishEngine(options.engine);
      let disposed = false;
      let lastFen: string | null = null;

      const analyze = async (fen: string) => {
        lastFen = fen;
        try {
          const result = await engine.analyze({
            fen,
            depth: options.depth,
            movetimeMs: options.movetimeMs,
            multiPv: options.multiPv,
          });
          if (disposed || lastFen !== fen) return;
          options.onResult?.(result);
        } catch (error) {
          if (disposed) return;
          const asError = error instanceof Error ? error : new Error('Engine analysis failed');
          options.onError?.(asError);
        }
      };

      return {
        async onInit(ctx) {
          await engine.init();
          options.onReady?.(engine);
          if (options.autoStart !== false) {
            void analyze(ctx.board.getCurrentFEN());
          }

          ctx.registerExtensionPoint('move', ({ fen }) => {
            void analyze(fen);
          });
          ctx.registerExtensionPoint('update', ({ fen }) => {
            void analyze(fen);
          });
        },
        onDestroy() {
          disposed = true;
          engine.terminate();
        },
      };
    },
  };
}
