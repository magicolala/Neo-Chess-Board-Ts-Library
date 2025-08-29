import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { NeoChessBoard } from '../../src/react/NeoChessBoard';

// Mock the core NeoChessBoard class
const mockBoard = {
  on: jest.fn(() => jest.fn()), // Return unsubscribe function
  destroy: jest.fn(),
  setPosition: jest.fn()
};

jest.mock('../../src/core/NeoChessBoard', () => ({
  NeoChessBoard: jest.fn().mockImplementation(() => mockBoard)
}));

describe('NeoChessBoard React Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<NeoChessBoard />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
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
  });

  describe('Board initialization', () => {
    it('should create board instance on mount', () => {
      const { NeoChessBoard: MockedBoard } = require('../../src/core/NeoChessBoard');
      
      render(<NeoChessBoard theme="midnight" />);
      
      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          theme: 'midnight'
        })
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
        highlightLegal: false
      };
      
      render(<NeoChessBoard {...options} />);
      
      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining(options)
      );
    });

    it('should destroy board instance on unmount', () => {
      const { unmount } = render(<NeoChessBoard />);
      
      unmount();
      
      expect(mockBoard.destroy).toHaveBeenCalled();
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

    it('should call move handler when board emits move event', () => {
      const onMove = jest.fn();
      let moveCallback: any;
      
      (mockBoard.on as jest.Mock).mockImplementation((event: string, callback: Function) => {
        if (event === 'move') {
          moveCallback = callback;
        }
        return jest.fn();
      });
      
      render(<NeoChessBoard onMove={onMove} />);
      
      const moveData = { from: 'e2', to: 'e4', fen: 'test-fen' };
      moveCallback(moveData);
      
      expect(onMove).toHaveBeenCalledWith(moveData);
    });

    it('should unsubscribe from events on unmount', () => {
      const unsubscribe = jest.fn();
      mockBoard.on.mockReturnValue(unsubscribe);
      
      const { unmount } = render(
        <NeoChessBoard 
          onMove={jest.fn()} 
          onIllegal={jest.fn()} 
          onUpdate={jest.fn()} 
        />
      );
      
      unmount();
      
      expect(unsubscribe).toHaveBeenCalledTimes(3); // One for each event
    });
  });

  describe('Position updates', () => {
    it('should update board position when fen prop changes', () => {
      const testFEN1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const testFEN2 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
      
      const { rerender } = render(<NeoChessBoard fen={testFEN1} />);
      
      rerender(<NeoChessBoard fen={testFEN2} />);
      
      expect(mockBoard.setPosition).toHaveBeenCalledWith(testFEN2);
    });

    it('should not update position when fen is undefined', () => {
      const { rerender } = render(<NeoChessBoard />);
      
      rerender(<NeoChessBoard fen={undefined} />);
      
      expect(mockBoard.setPosition).not.toHaveBeenCalled();
    });

    it('should not update position when fen does not change', () => {
      const testFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const { rerender } = render(<NeoChessBoard fen={testFEN} />);
      rerender(<NeoChessBoard fen={testFEN} />);
      
      expect(mockBoard.setPosition).toHaveBeenCalledTimes(0);
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
        fen: 'custom-fen'
      };
      
      render(<NeoChessBoard {...props} />);
      
      expect(MockedBoard).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining(props)
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
        />
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
