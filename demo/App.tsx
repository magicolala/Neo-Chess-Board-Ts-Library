import { useMemo, useState } from 'react';
import { NeoChessBoard } from '../src/react';
import type { Theme as BoardTheme } from '../src/core/types';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

type ThemeOption = 'midnight' | 'wood' | 'ice';

const themeConfig: Record<ThemeOption, BoardTheme | string> = {
  midnight: 'midnight',
  wood: {
    light: '#f1d8b0',
    dark: '#9b6a3f',
    boardBorder: '#3f2a1b',
    whitePiece: '#f4ede4',
    blackPiece: '#2f1b0f',
    pieceShadow: 'rgba(0, 0, 0, 0.35)',
    pieceStroke: 'rgba(42, 25, 17, 0.75)',
    pieceHighlight: 'rgba(255, 255, 255, 0.45)',
    moveFrom: 'rgba(251, 191, 36, 0.45)',
    moveTo: 'rgba(34, 197, 94, 0.45)',
    moveHighlight: 'rgba(34, 197, 94, 0.45)',
    lastMove: 'rgba(59, 130, 246, 0.35)',
    premove: 'rgba(147, 51, 234, 0.35)',
    check: 'rgba(248, 113, 113, 0.55)',
    checkmate: 'rgba(220, 38, 38, 0.6)',
    stalemate: 'rgba(249, 115, 22, 0.55)',
    dot: 'rgba(63, 42, 27, 0.35)',
    arrow: 'rgba(217, 119, 6, 0.9)',
    squareNameColor: '#2f1b0f',
  },
  ice: {
    light: '#e8f5ff',
    dark: '#7aa5d2',
    boardBorder: '#1e2a3d',
    whitePiece: '#ffffff',
    blackPiece: '#102336',
    pieceShadow: 'rgba(0, 0, 0, 0.2)',
    pieceStroke: 'rgba(16, 35, 54, 0.75)',
    pieceHighlight: 'rgba(255, 255, 255, 0.55)',
    moveFrom: 'rgba(96, 165, 250, 0.35)',
    moveTo: 'rgba(34, 197, 94, 0.35)',
    moveHighlight: 'rgba(34, 197, 94, 0.35)',
    lastMove: 'rgba(59, 130, 246, 0.35)',
    premove: 'rgba(147, 51, 234, 0.35)',
    check: 'rgba(248, 113, 113, 0.55)',
    checkmate: 'rgba(220, 38, 38, 0.6)',
    stalemate: 'rgba(249, 115, 22, 0.55)',
    dot: 'rgba(255, 255, 255, 0.45)',
    arrow: 'rgba(96, 165, 250, 0.9)',
    squareNameColor: '#102336',
  },
};

function App() {
  const [theme, setTheme] = useState<ThemeOption>('midnight');
  const boardTheme = useMemo(() => themeConfig[theme], [theme]);

  return (
    <div className="h-dvh w-dvw flex flex-col gap-4 p-4">
      {/* HEADER */}
      <header className="flex items-center justify-between rounded-xl2 border border-borderc-light bg-bg-secondary/80 shadow-soft px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
          <h1 className="text-lg font-semibold">Maia-style Chess Lab</h1>
          <Badge variant="secondary" className="bg-accent/15 text-textc-secondary">
            Thème : {theme}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {(['midnight', 'wood', 'ice'] as const).map((option) => (
            <Button
              key={option}
              variant={theme === option ? 'default' : 'secondary'}
              className={theme === option ? undefined : 'bg-bg-secondary'}
              onClick={() => setTheme(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </header>

      {/* MAIN GRID FULLSCREEN */}
      <main className="grid flex-1 gap-4 grid-cols-1 xl:grid-cols-[minmax(520px,1fr)_minmax(420px,520px)]">
        {/* COL GAUCHE : BOARD CARD */}
        <Card className="overflow-hidden flex">
          <CardContent className="p-0 flex-1">
            <div className="h-full w-full flex items-center justify-center p-4">
              <div className="w-full max-w-[720px] aspect-square rounded-xl2 overflow-hidden border border-borderc-light">
                <NeoChessBoard
                  size={720}
                  theme={boardTheme}
                  showCoordinates
                  showArrows
                  highlightLegal
                  allowPremoves
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COL DROITE : PANELS SCROLLABLES */}
        <div className="flex flex-col gap-4 h-full">
          {/* MOVES */}
          <Card className="flex-1 min-h-0">
            <CardHeader>
              <CardTitle>Coups & commentaires</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3 text-textc-secondary">
                  {Array.from({ length: 40 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-borderc-light/50 bg-bg-secondary/50 px-3 py-2"
                    >
                      <span>{index + 1}. e4 …</span>
                      <Badge className="bg-accent/10">+0.31</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* ANALYSE */}
          <Card className="flex-[0.7] min-h-0">
            <CardHeader>
              <CardTitle>Analyse Maia/Stockfish</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-2 gap-3 text-textc-secondary">
                  <div className="rounded-lg border border-borderc-light/50 bg-bg-secondary/50 p-3">
                    <div className="text-sm">White win %</div>
                    <div className="text-2xl font-semibold text-textc-primary">57.5%</div>
                  </div>
                  <div className="rounded-lg border border-borderc-light/50 bg-bg-secondary/50 p-3">
                    <div className="text-sm">SF Eval</div>
                    <div className="text-2xl font-semibold text-textc-primary">+0.31</div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
export { App };
