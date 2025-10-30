import '@testing-library/jest-dom';

// Configure React testing environment
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

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

const Path2DConstructor = MockPath2D as unknown as typeof Path2D;

// Provide minimal Path2D for Node test environment
(globalThis as typeof globalThis & { Path2D: typeof Path2D }).Path2D = Path2DConstructor;

const createMockContext = (): CanvasRenderingContext2D => {
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
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
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
  } as unknown as CanvasRenderingContext2D;
};

type CanvasContextGetter = typeof HTMLCanvasElement.prototype.getContext;

const getContextImplementation: CanvasContextGetter = ((contextId: string) => {
  if (contextId === '2d') {
    return createMockContext();
  }
  return null;
}) as CanvasContextGetter;

const getContextMock = jest.fn(
  getContextImplementation,
) as jest.MockedFunction<CanvasContextGetter>;

// Mock canvas API pour les tests
globalThis.HTMLCanvasElement.prototype.getContext = getContextMock;

// Mock ResizeObserver
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock OffscreenCanvas
globalThis.OffscreenCanvas = jest.fn().mockImplementation((width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
});

// Mock URL.createObjectURL et URL.revokeObjectURL
globalThis.URL.createObjectURL = jest.fn(() => 'mock-object-url');
globalThis.URL.revokeObjectURL = jest.fn();

// Mock window.devicePixelRatio
Object.defineProperty(globalThis, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
});
