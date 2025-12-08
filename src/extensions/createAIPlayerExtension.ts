import { StockfishEngine } from '../engine/StockfishEngine';
import type { EngineCreateOptions } from '../engine/types';
import type { ExtensionConfig, ExtensionContext, PromotionPiece, Square } from '../core/types';

export interface AIPlayerExtensionOptions {
  readonly engine?: EngineCreateOptions;
  readonly aiColor?: 'white' | 'black';
  readonly movetimeMs?: number;
  readonly depth?: number;
  readonly onMoveStart?: () => void;
  readonly onMoveComplete?: (move: string) => void;
  readonly onError?: (error: Error) => void;
}

export interface AIPlayerExtensionConfig extends AIPlayerExtensionOptions {
  readonly id?: string;
}

function parseUciMove(
  move: string,
): { from: Square; to: Square; promotion?: PromotionPiece } | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move)) return null;
  const from = move.slice(0, 2) as Square;
  const to = move.slice(2, 4) as Square;
  const promotion = move[4]?.toLowerCase() as PromotionPiece | undefined;
  return { from, to, promotion };
}

export function createAIPlayerExtension(
  config: AIPlayerExtensionConfig = {},
): ExtensionConfig<AIPlayerExtensionOptions> {
  const { id, ...options } = config;
  return {
    id: id ?? 'ai-player',
    options,
    create(context: ExtensionContext<AIPlayerExtensionOptions>) {
      const engine = new StockfishEngine(options.engine);
      let disposed = false;
      let thinking = false;

      const triggerAIMove = async (fen: string) => {
        if (disposed || thinking) return;
        thinking = true;
        options.onMoveStart?.();
        try {
          const move = await engine.getBestMove(fen, options.movetimeMs ?? 400);
          if (!move) throw new Error('Engine did not return a move');
          const parsed = parseUciMove(move);
          if (!parsed) throw new Error(`Invalid engine move: ${move}`);
          context.board.attemptMove(parsed.from, parsed.to, { promotion: parsed.promotion });
          options.onMoveComplete?.(move);
        } catch (error) {
          const asError = error instanceof Error ? error : new Error('AI move failed');
          options.onError?.(asError);
        } finally {
          thinking = false;
        }
      };

    const maybePlayForEngine = (fen: string) => {
      const turn = context.board.getTurn();
      const aiColor = options.aiColor ?? 'black';
      const shouldMove =
        (turn === 'w' && aiColor === 'white') || (turn === 'b' && aiColor === 'black');
      if (shouldMove) {
        void triggerAIMove(fen);
      }
    };

      return {
        async onInit(ctx) {
          await engine.init();
          maybePlayForEngine(ctx.board.getCurrentFEN());
          ctx.registerExtensionPoint('move', ({ fen }) => maybePlayForEngine(fen));
        },
        onDestroy() {
          disposed = true;
          engine.terminate();
        },
      };
    },
  };
}
