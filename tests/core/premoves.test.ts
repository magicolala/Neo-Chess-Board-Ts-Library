import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import { LightRules } from '../../src/core/LightRules';

// Créer un moteur d'échecs pour les tests
const createMockEngine = () => {
  let position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return {
    setFEN: jest.fn((fen: string) => {
      position = fen;
    }),
    getFEN: jest.fn(() => position),
    turn: jest.fn(() => position.split(' ')[1] as 'w' | 'b'),
    movesFrom: jest.fn(() => [
      { from: 'e2' as any, to: 'e4' as any },
      { from: 'e2' as any, to: 'e3' as any },
    ]),
    move: jest.fn((move: any) => {
      // Simuler un mouvement valide
      if (move.from === 'e2' && move.to === 'e4') {
        position = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        return { ok: true, fen: position };
      }
      if (move.from === 'e7' && move.to === 'e5') {
        position = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
        return { ok: true, fen: position };
      }
      if (move.from === 'g1' && move.to === 'f3') {
        position = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
        return { ok: true, fen: position };
      }
      return { ok: false, reason: 'illegal move' };
    }),
  };
};

describe('Premoves', () => {
  let container: HTMLElement;
  let board: NeoChessBoard;
  let mockEngine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockEngine = createMockEngine();
    board = new NeoChessBoard(container, {
      allowPremoves: true,
      rulesAdapter: mockEngine as any,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    });
  });

  afterEach(() => {
    board.destroy();
    document.body.removeChild(container);
  });

  it('should allow setting a premove programmatically', () => {
    const premove = { from: 'e7' as any, to: 'e5' as any };

    board.setPremove(premove);

    const currentPremove = board.getPremove();
    expect(currentPremove).toEqual(premove);
  });

  it('should clear premoves', () => {
    const premove = { from: 'e7' as any, to: 'e5' as any };

    board.setPremove(premove);
    expect(board.getPremove()).toEqual(premove);

    board.clearPremove();
    expect(board.getPremove()).toBeNull();
  });

  it('should execute premove automatically when position changes', (done) => {
    const premove = { from: 'e7' as any, to: 'e5' as any };

    // Définir un premove pour les noirs
    board.setPremove(premove);

    // Vérifier que le premove est stocké
    expect(board.getPremove()).toEqual(premove);

    // Écouter les événements de mouvement
    board.on('move', ({ from, to }) => {
      // Ce mouvement devrait être le premove automatique des noirs
      expect(from).toBe('e7');
      expect(to).toBe('e5');

      // Le premove devrait être effacé après exécution
      setTimeout(() => {
        expect(board.getPremove()).toBeNull();
        done();
      }, 200);
    });

    // Simuler un mouvement des blancs qui déclenche l'exécution du premove
    // Changer la position pour que ce soit le tour des noirs
    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  });

  it('should clear invalid premoves when position changes', (done) => {
    const invalidPremove = { from: 'e7' as any, to: 'e3' as any }; // Mouvement invalide

    board.setPremove(invalidPremove);
    expect(board.getPremove()).toEqual(invalidPremove);

    // Changer la position (ce qui devrait essayer d'exécuter le premove invalide)
    board.setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

    // Le premove invalide devrait être effacé
    setTimeout(() => {
      expect(board.getPremove()).toBeNull();
      done();
    }, 200);
  });

  it('should not allow premoves when disabled', () => {
    // Créer un board avec premoves désactivés
    board.destroy();
    board = new NeoChessBoard(container, {
      allowPremoves: false,
      rulesAdapter: mockEngine as any,
    });

    const premove = { from: 'e7' as any, to: 'e5' as any };

    board.setPremove(premove);

    // Le premove ne devrait pas être défini car ils sont désactivés
    expect(board.getPremove()).toBeNull();
  });

  it('should export and import premoves with drawings', () => {
    const premove = { from: 'e7' as any, to: 'e5' as any };

    board.setPremove(premove);

    const exported = board.exportDrawings();
    expect(exported).toBeTruthy();

    // Effacer et réimporter
    board.clearPremove();
    expect(board.getPremove()).toBeNull();

    board.importDrawings(exported!);
    expect(board.getPremove()).toEqual(premove);
  });
});
