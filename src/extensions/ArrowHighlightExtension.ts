import type {
  Arrow,
  Square,
  SquareHighlight,
  ExtensionConfig,
  ExtensionContext,
} from '../core/types';

export interface ArrowHighlightExtensionOptions {
  arrows?: Arrow[];
  highlights?: SquareHighlight[];
  highlightLastMove?: boolean;
  lastMoveColor?: string;
  persistOnUpdate?: boolean;
}

export interface ArrowHighlightExtensionConfig extends ArrowHighlightExtensionOptions {
  id?: string;
}

const arrowKey = (from: Square, to: Square) => `${from}-${to}`;

export function createArrowHighlightExtension(
  config: ArrowHighlightExtensionConfig = {},
): ExtensionConfig<ArrowHighlightExtensionOptions> {
  const { id, ...rest } = config;

  return {
    id: id ?? 'arrow-highlight',
    options: rest,
    create(context) {
      const {
        arrows = [],
        highlights = [],
        highlightLastMove = true,
        lastMoveColor,
        persistOnUpdate = true,
      } = context.options ?? {};

      const initialArrows = new Map<string, Arrow>();
      const initialHighlights = new Map<string, SquareHighlight>();

      for (const arrow of arrows) {
        initialArrows.set(arrowKey(arrow.from, arrow.to), arrow);
      }

      for (const highlight of highlights) {
        initialHighlights.set(highlight.square, highlight);
      }

      let lastMove: { from: Square; to: Square } | null = null;
      let replacedInitialArrow: Arrow | null = null;

      const applyInitialArrows = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        for (const arrow of initialArrows.values()) {
          ctx.board.addArrow(arrow);
        }
      };

      const applyInitialHighlights = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        for (const highlight of initialHighlights.values()) {
          ctx.board.addHighlight(highlight);
        }
      };

      const clearInitialArrows = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        for (const arrow of initialArrows.values()) {
          ctx.board.removeArrow(arrow.from, arrow.to);
        }
      };

      const clearInitialHighlights = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        for (const highlight of initialHighlights.values()) {
          ctx.board.removeHighlight(highlight.square);
        }
      };

      const clearInitialDrawings = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        clearInitialHighlights(ctx);
        clearInitialArrows(ctx);
      };

      const applyInitialDrawings = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        applyInitialArrows(ctx);
        applyInitialHighlights(ctx);
      };

      const clearCurrentLastMove = (
        ctx: ExtensionContext<ArrowHighlightExtensionOptions>,
        resetState = true,
      ) => {
        if (!lastMove) return;
        ctx.board.removeArrow(lastMove.from, lastMove.to);
        if (replacedInitialArrow) {
          ctx.board.addArrow(replacedInitialArrow);
        }
        if (resetState) {
          lastMove = null;
          replacedInitialArrow = null;
        }
      };

      const drawLastMove = (ctx: ExtensionContext<ArrowHighlightExtensionOptions>) => {
        if (!lastMove) return;
        ctx.board.addArrow({
          from: lastMove.from,
          to: lastMove.to,
          color: lastMoveColor,
        });
      };

      const setLastMove = (
        ctx: ExtensionContext<ArrowHighlightExtensionOptions>,
        from: Square,
        to: Square,
      ) => {
        if (!highlightLastMove) return;
        clearCurrentLastMove(ctx);
        lastMove = { from, to };
        replacedInitialArrow = initialArrows.get(arrowKey(from, to)) ?? null;
        drawLastMove(ctx);
      };

      return {
        onInit(ctx) {
          applyInitialDrawings(ctx);

          if (persistOnUpdate) {
            ctx.registerExtensionPoint('update', () => {
              if (highlightLastMove && lastMove) {
                clearCurrentLastMove(ctx, false);
              }
              clearInitialDrawings(ctx);
              applyInitialDrawings(ctx);
              if (highlightLastMove && lastMove) {
                replacedInitialArrow =
                  initialArrows.get(arrowKey(lastMove.from, lastMove.to)) ?? null;
                drawLastMove(ctx);
              }
            });
          }
        },
        onMove(ctx, payload) {
          setLastMove(ctx, payload.from, payload.to);
        },
        onDestroy(ctx) {
          if (highlightLastMove) {
            clearCurrentLastMove(ctx);
          }
          clearInitialDrawings(ctx);
        },
      };
    },
  };
}
