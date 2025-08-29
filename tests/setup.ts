import '@testing-library/jest-dom';

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
      arc: jest.fn(),
      ellipse: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn(),
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
      canvas: {} as HTMLCanvasElement
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
