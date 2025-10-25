import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { NeoChessBoard } from '../../src/react/NeoChessBoard';
import type { NeoChessProps, NeoChessRef } from '../../src/react/NeoChessBoard';
import type { Theme, BoardEventMap, Arrow } from '../../src/core/types';

// Mock the core NeoChessBoard class
let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default FEN

const mockBoard = {
  on: jest.fn(() => jest.fn()), // Return unsubscribe function
  destroy: jest.fn(),
  getPosition: jest.fn(() => currentFen), // Mock getPosition to return currentFen
  setTheme: jest.fn(),
  applyTheme: jest.fn(),
  setPieceSet: jest.fn(),
  setSoundEnabled: jest.fn(),
  setSoundUrls: jest.fn(),
  setSoundEventUrls: jest.fn(),
  setAutoFlip: jest.fn(),
  setOrientation: jest.fn(),
  setShowArrows: jest.fn(),
  setShowHighlights: jest.fn(),
  setAllowPremoves: jest.fn(),
  setHighlightLegal: jest.fn(),
  setShowSquareNames: jest.fn(),
  setShowNotation: jest.fn(),
  setBoardStyle: jest.fn(),
  setBoardId: jest.fn(),
  setSquareStyle: jest.fn(),
  setLightSquareStyle: jest.fn(),
  setDarkSquareStyle: jest.fn(),
  setSquareStyles: jest.fn(),
  setLightSquareNotationStyle: jest.fn(),
  setDarkSquareNotationStyle: jest.fn(),
  setAlphaNotationStyle: jest.fn(),
  setNumericNotationStyle: jest.fn(),
  setSquareRenderer: jest.fn(),
  setPieceRenderers: jest.fn(),
  setAllowDrawingArrows: jest.fn(),
  setClearArrowsOnClick: jest.fn(),
  setArrowOptions: jest.fn(),
  setArrows: jest.fn(),
  setOnArrowsChange: jest.fn(),
  setAnimationDuration: jest.fn(),
  setShowAnimations: jest.fn(),
  setDraggingEnabled: jest.fn(),
  setAllowDragOffBoard: jest.fn(),
  setAutoScrollEnabled: jest.fn(),
  setCanDragPiece: jest.fn(),
  setDragActivationDistance: jest.fn(),
  setFEN: jest.fn((fen: string) => {
    // Mock setFEN to update currentFen
    currentFen = fen;
  }),
  addArrow: jest.fn(),
  addHighlight: jest.fn(),
  clearArrows: jest.fn(),
  clearHighlights: jest.fn(),
};

const createPointerEvent = () =>
  typeof globalThis.PointerEvent === 'function'
    ? new globalThis.PointerEvent('pointerdown')
    : ({ type: 'pointerdown' } as unknown as PointerEvent);

jest.mock('../../src/core/NeoChessBoard', () => ({
  NeoChessBoard: jest.fn().mockImplementation(() => mockBoard),
}));

describe('NeoChessBoard React Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    mockBoard.on.mockImplementation(() => jest.fn());
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Reset FEN after each test
  });

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<NeoChessBoard />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply className prop', () => {
      const { container } = render(<NeoChessBoard className="test-class" />);
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should apply style prop', () => {
      const testStyle = { width: '400px', height: '400px' };
      const { container } = render(<NeoChessBoard style={testStyle} />);

      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('400px');
      expect(element.style.height).toBe('400px');
    });

    it('applies aspect ratio for non-square boards', () => {
      const { container } = render(
        <NeoChessBoard chessboardColumns={10} chessboardRows={8} size={400} />,
      );

      const element = container.firstChild as HTMLElement;
      expect(element.style.aspectRatio).toBe('10 / 8');
      expect(element.style.maxHeight).toBe('320px');
    });
  });

  describe('Board initialization', () => {
    it('should create board instance on mount', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      render(<NeoChessBoard theme="midnight" />);

      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          theme: 'midnight',
        }),
      );
    });

    it('should pass board options correctly', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      const options = {
        theme: 'classic' as const,
        orientation: 'black' as const,
        interactive: false,
        showCoordinates: true,
        animationMs: 200,
        highlightLegal: false,
        autoFlip: true,
      };

      render(<NeoChessBoard {...options} />);

      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining(options),
      );
    });

    it('should destroy board instance on unmount', () => {
      const { unmount } = render(<NeoChessBoard />);

      unmount();

      expect(mockBoard.destroy).toHaveBeenCalled();
    });

    it('maps position alias to fen and position options', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      const fenString = '8/8/8/8/8/8/8/8 w - - 0 1';
      render(<NeoChessBoard position={fenString} />);

      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          position: fenString,
          fen: fenString,
        }),
      );
    });
  });

  describe('Event handling', () => {
    it('should register move event handler', () => {
      const onMove = jest.fn();

      render(<NeoChessBoard onMove={onMove} />);

      expect(mockBoard.on).toHaveBeenCalledWith('move', expect.any(Function));
    });

    it('should register illegal move event handler', () => {
      const onIllegal = jest.fn();

      render(<NeoChessBoard onIllegal={onIllegal} />);

      expect(mockBoard.on).toHaveBeenCalledWith('illegal', expect.any(Function));
    });

    it('should register update event handler', () => {
      const onUpdate = jest.fn();

      render(<NeoChessBoard onUpdate={onUpdate} />);

      expect(mockBoard.on).toHaveBeenCalledWith('update', expect.any(Function));
    });

    it.each([
      ['squareClick', 'onSquareClick'],
      ['squareMouseDown', 'onSquareMouseDown'],
      ['squareMouseUp', 'onSquareMouseUp'],
      ['squareRightClick', 'onSquareRightClick'],
      ['squareMouseOver', 'onSquareMouseOver'],
      ['squareMouseOut', 'onSquareMouseOut'],
      ['pieceClick', 'onPieceClick'],
      ['pieceDrag', 'onPieceDrag'],
      ['pieceDrop', 'onPieceDrop'],
    ])('should register %s event handler', (eventName, propName) => {
      const handler = jest.fn();
      const props = { [propName]: handler } as unknown as NeoChessProps;

      render(<NeoChessBoard {...props} />);

      expect(mockBoard.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    });

    it('should call move handler when board emits move event', () => {
      const onMove = jest.fn();
      let moveCallback: ((payload: BoardEventMap['move']) => void) | undefined;

      (mockBoard.on as jest.Mock).mockImplementation((event: string, callback: Function) => {
        if (event === 'move') {
          moveCallback = callback as (payload: BoardEventMap['move']) => void;
        }
        return jest.fn();
      });

      render(<NeoChessBoard onMove={onMove} />);

      const moveData: BoardEventMap['move'] = { from: 'e2', to: 'e4', fen: 'test-fen' };
      moveCallback?.(moveData);

      expect(onMove).toHaveBeenCalledWith(moveData);
    });

    it('should unsubscribe from events on unmount', () => {
      const unsubscribe = jest.fn();
      mockBoard.on.mockReturnValue(unsubscribe);

      const { unmount } = render(<NeoChessBoard />);

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(12); // All registered events
    });

    it.each([
      [
        'squareClick',
        'onSquareClick',
        (): BoardEventMap['squareClick'] => ({
          square: 'e4',
          piece: 'P',
          event: createPointerEvent(),
        }),
      ],
      [
        'squareMouseDown',
        'onSquareMouseDown',
        (): BoardEventMap['squareMouseDown'] => ({
          square: 'e2',
          piece: null,
          event: createPointerEvent(),
        }),
      ],
      [
        'squareMouseUp',
        'onSquareMouseUp',
        (): BoardEventMap['squareMouseUp'] => ({
          square: 'd4',
          piece: 'n',
          event: createPointerEvent(),
        }),
      ],
      [
        'squareRightClick',
        'onSquareRightClick',
        (): BoardEventMap['squareRightClick'] => ({
          square: 'h7',
          piece: 'p',
          event: createPointerEvent(),
        }),
      ],
      [
        'squareMouseOver',
        'onSquareMouseOver',
        (): BoardEventMap['squareMouseOver'] => ({
          square: 'c3',
          piece: null,
          relatedSquare: 'c2',
          event: createPointerEvent(),
        }),
      ],
      [
        'squareMouseOut',
        'onSquareMouseOut',
        (): BoardEventMap['squareMouseOut'] => ({
          square: 'b5',
          piece: 'q',
          relatedSquare: 'b6',
          event: createPointerEvent(),
        }),
      ],
      [
        'pieceClick',
        'onPieceClick',
        (): BoardEventMap['pieceClick'] => ({
          square: 'a1',
          piece: 'R',
          event: createPointerEvent(),
        }),
      ],
      [
        'pieceDrag',
        'onPieceDrag',
        (): BoardEventMap['pieceDrag'] => ({
          from: 'g1',
          piece: 'N',
          over: 'e2',
          position: { x: 42, y: 84 },
          event: createPointerEvent(),
        }),
      ],
      [
        'pieceDrop',
        'onPieceDrop',
        (): BoardEventMap['pieceDrop'] => ({
          from: 'g1',
          piece: 'N',
          drop: 'e2',
          position: { x: 42, y: 84 },
          event: createPointerEvent(),
        }),
      ],
    ])('should forward %s payloads to provided handler', (eventName, propName, payloadFactory) => {
      const handler = jest.fn();
      let captured: ((payload: unknown) => void) | undefined;

      (mockBoard.on as jest.Mock).mockImplementation((type: string, callback: Function) => {
        if (type === eventName) {
          captured = callback as (payload: unknown) => void;
        }
        return jest.fn();
      });

      const props = { [propName]: handler } as unknown as NeoChessProps;
      render(<NeoChessBoard {...props} />);

      expect(mockBoard.on).toHaveBeenCalledWith(eventName, expect.any(Function));

      const payload = payloadFactory();
      captured?.(payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  describe('Position updates', () => {
    it('should update board position when fen prop changes', () => {
      const testFEN1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const testFEN2 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';

      const { rerender } = render(<NeoChessBoard fen={testFEN1} />);

      rerender(<NeoChessBoard fen={testFEN2} />);

      expect(mockBoard.setFEN).toHaveBeenCalledWith(testFEN2);
    });

    it('should not update position when fen is undefined', () => {
      const { rerender } = render(<NeoChessBoard />);

      rerender(<NeoChessBoard fen={undefined} />);

      expect(mockBoard.setFEN).not.toHaveBeenCalled();
    });

    it('should not update position when fen does not change', () => {
      const testFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      const { rerender } = render(<NeoChessBoard fen={testFEN} />);

      // Clear the mock after initial render
      mockBoard.setFEN.mockClear();

      rerender(<NeoChessBoard fen={testFEN} />);

      expect(mockBoard.setFEN).toHaveBeenCalledTimes(0);
    });
  });

  describe('Position alias updates', () => {
    it('updates the board when the position prop changes', async () => {
      const initialFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const nextFen = 'k7/8/8/8/8/8/8/K7 w - - 0 1';

      const { rerender } = render(<NeoChessBoard position={initialFen} />);

      rerender(<NeoChessBoard position={nextFen} />);

      await waitFor(() => {
        expect(mockBoard.setFEN).toHaveBeenCalledWith(nextFen);
      });
    });
  });

  describe('Dynamic options updates', () => {
    it('should forward option changes to the board instance', () => {
      const canDragPiece = jest.fn();
      const nextCanDragPiece = jest.fn();
      const arrowsChange = jest.fn();
      const nextArrowsChange = jest.fn();
      const initialArrows: Arrow[] = [{ from: 'a2', to: 'a4', color: '#fff' }];
      const nextArrows: Arrow[] = [{ from: 'b2', to: 'b4', color: '#000' }];
      const { rerender } = render(
        <NeoChessBoard
          soundEnabled={false}
          orientation="white"
          showArrows={false}
          showHighlights={false}
          allowPremoves={false}
          highlightLegal={false}
          showSquareNames={false}
          autoFlip={false}
          allowAutoScroll={false}
          allowDragging={false}
          allowDragOffBoard={false}
          showAnimations={false}
          dragActivationDistance={10}
          animationDurationInMs={200}
          canDragPiece={canDragPiece}
          allowDrawingArrows={false}
          clearArrowsOnClick={false}
          arrowOptions={{ width: 3 }}
          arrows={initialArrows}
          onArrowsChange={arrowsChange}
        />,
      );

      [
        mockBoard.setSoundEnabled,
        mockBoard.setAutoFlip,
        mockBoard.setOrientation,
        mockBoard.setShowArrows,
        mockBoard.setShowHighlights,
        mockBoard.setAllowPremoves,
        mockBoard.setHighlightLegal,
        mockBoard.setShowSquareNames,
        mockBoard.setAutoScrollEnabled,
        mockBoard.setDraggingEnabled,
        mockBoard.setAllowDragOffBoard,
        mockBoard.setShowAnimations,
        mockBoard.setDragActivationDistance,
        mockBoard.setAnimationDuration,
        mockBoard.setCanDragPiece,
        mockBoard.setAllowDrawingArrows,
        mockBoard.setClearArrowsOnClick,
        mockBoard.setArrowOptions,
        mockBoard.setArrows,
        mockBoard.setOnArrowsChange,
      ].forEach((fn) => fn.mockClear());

      rerender(
        <NeoChessBoard
          soundEnabled
          orientation="black"
          showArrows
          showHighlights
          allowPremoves
          highlightLegal
          showSquareNames
          autoFlip
          allowAutoScroll
          allowDragging
          allowDragOffBoard
          showAnimations
          dragActivationDistance={4}
          animationDurationInMs={350}
          canDragPiece={nextCanDragPiece}
          allowDrawingArrows
          clearArrowsOnClick
          arrowOptions={{ width: 5, opacity: 0.7 }}
          arrows={nextArrows}
          onArrowsChange={nextArrowsChange}
        />,
      );

      expect(mockBoard.setSoundEnabled).toHaveBeenCalledWith(true);
      expect(mockBoard.setAutoFlip).toHaveBeenCalledWith(true);
      expect(mockBoard.setOrientation).toHaveBeenCalledWith('black');
      expect(mockBoard.setShowArrows).toHaveBeenCalledWith(true);
      expect(mockBoard.setShowHighlights).toHaveBeenCalledWith(true);
      expect(mockBoard.setAllowPremoves).toHaveBeenCalledWith(true);
      expect(mockBoard.setHighlightLegal).toHaveBeenCalledWith(true);
      expect(mockBoard.setShowSquareNames).toHaveBeenCalledWith(true);
      expect(mockBoard.setAutoScrollEnabled).toHaveBeenCalledWith(true);
      expect(mockBoard.setDraggingEnabled).toHaveBeenCalledWith(true);
      expect(mockBoard.setAllowDragOffBoard).toHaveBeenCalledWith(true);
      expect(mockBoard.setShowAnimations).toHaveBeenCalledWith(true);
      expect(mockBoard.setDragActivationDistance).toHaveBeenCalledWith(4);
      expect(mockBoard.setAnimationDuration).toHaveBeenCalledWith(350);
      expect(mockBoard.setCanDragPiece).toHaveBeenCalledWith(nextCanDragPiece);
      expect(mockBoard.setAllowDrawingArrows).toHaveBeenCalledWith(true);
      expect(mockBoard.setClearArrowsOnClick).toHaveBeenCalledWith(true);
      expect(mockBoard.setArrowOptions).toHaveBeenCalledWith({ width: 5, opacity: 0.7 });
      expect(mockBoard.setArrows).toHaveBeenCalledWith(nextArrows);
      expect(mockBoard.setOnArrowsChange).toHaveBeenCalledWith(nextArrowsChange);
    });

    it('should call applyTheme when theme prop is a custom object', () => {
      const customTheme: Theme = {
        light: '#FFFFFF',
        dark: '#0F172A',
        boardBorder: '#1E293B',
        whitePiece: '#F8FAFC',
        blackPiece: '#0B1120',
        pieceShadow: 'rgba(0,0,0,0.2)',
        moveFrom: 'rgba(251, 191, 36, 0.5)',
        moveTo: 'rgba(74, 222, 128, 0.45)',
        lastMove: 'rgba(96, 165, 250, 0.45)',
        premove: 'rgba(217, 70, 239, 0.35)',
        dot: 'rgba(15, 23, 42, 0.35)',
        arrow: 'rgba(34, 197, 94, 0.9)',
        squareNameColor: '#F8FAFC',
      };

      const { rerender } = render(<NeoChessBoard theme="classic" />);

      mockBoard.applyTheme.mockClear();
      mockBoard.setTheme.mockClear();

      rerender(<NeoChessBoard theme={customTheme} />);

      expect(mockBoard.applyTheme).toHaveBeenCalledWith(customTheme);
      expect(mockBoard.setTheme).not.toHaveBeenCalledWith(customTheme);
    });
  });

  describe('Component lifecycle', () => {
    it('should handle multiple re-renders safely', () => {
      const { rerender } = render(<NeoChessBoard theme="classic" />);

      expect(() => {
        rerender(<NeoChessBoard theme="midnight" />);
        rerender(<NeoChessBoard theme="classic" />);
      }).not.toThrow();
    });

    it('should not create multiple board instances on re-renders', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      const { rerender } = render(<NeoChessBoard />);
      rerender(<NeoChessBoard theme="midnight" />);

      // Should only be called once (on initial mount)
      expect(MockedBoard).toHaveBeenCalledTimes(1);
    });
  });

  describe('Imperative handle', () => {
    it('should expose board helpers through the ref', async () => {
      const ref = React.createRef<NeoChessRef>();

      render(<NeoChessBoard ref={ref} />);

      await waitFor(() => {
        expect(ref.current?.getBoard()).toBe(mockBoard);
      });

      const arrow = { from: 'a1' as const, to: 'a8' as const, color: '#ff0000' };
      ref.current?.addArrow(arrow);
      expect(mockBoard.addArrow).toHaveBeenCalledWith(arrow);

      ref.current?.addHighlight('e4', 'green');
      expect(mockBoard.addHighlight).toHaveBeenCalledWith('e4', 'green');

      ref.current?.clearArrows();
      expect(mockBoard.clearArrows).toHaveBeenCalled();

      ref.current?.clearHighlights();
      expect(mockBoard.clearHighlights).toHaveBeenCalled();
    });
  });

  describe('Props handling', () => {
    it('should handle all board options', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      const props = {
        size: 480,
        orientation: 'black' as const,
        interactive: true,
        theme: 'midnight' as const,
        showCoordinates: false,
        animationMs: 300,
        highlightLegal: true,
        fen: 'custom-fen',
      };

      render(<NeoChessBoard {...props} />);

      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining(props),
      );
    });

    it('should exclude React-specific props from board options', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');

      render(
        <NeoChessBoard
          className="test"
          style={{ width: '100%' }}
          onMove={jest.fn()}
          onIllegal={jest.fn()}
          onUpdate={jest.fn()}
          theme="classic"
        />,
      );

      const callArgs = MockedBoard.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('className');
      expect(callArgs).not.toHaveProperty('style');
      expect(callArgs).not.toHaveProperty('onMove');
      expect(callArgs).not.toHaveProperty('onIllegal');
      expect(callArgs).not.toHaveProperty('onUpdate');
      expect(callArgs).toHaveProperty('theme');
    });
  });
});
