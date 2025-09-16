import '@testing-library/jest-dom';

// Configure React testing environment
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

class MockPath2D {
  constructor(_path?: string | MockPath2D) {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  arc() {}
  ellipse() {}
  closePath() {}
  addPath(_path: MockPath2D) {}
  rect() {}
}
// Provide minimal Path2D for Node test environment
(global as any).Path2D = MockPath2D as unknown as Path2D;

// Mock canvas API pour les tests
global.HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      rect: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      canvas: {} as HTMLCanvasElement,
    } as any;
  }
  return null;
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock OffscreenCanvas
global.OffscreenCanvas = jest.fn().mockImplementation((width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
});

// Mock URL.createObjectURL et URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
});
