export type EasingFunction = (t: number) => number;

export interface CameraEffectsOptions {
  enabled?: boolean;
  maxZoom?: number;
  minZoom?: number;
  defaultDuration?: number;
  defaultEasing?: EasingFunction;
}

export interface ShakeOptions {
  intensity?: number;
  duration?: number;
  frequency?: number;
  decay?: number;
}

export interface CameraTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface ZoomTarget {
  square?: string;
  squares?: string[];
  center?: { x: number; y: number };
  scale?: number;
}

export interface ZoomOptions {
  duration?: number;
  easing?: EasingFunction;
  padding?: number;
}

export type CameraEvent =
  | 'camera:zoom:start'
  | 'camera:zoom:end'
  | 'camera:shake:start'
  | 'camera:shake:end'
  | 'camera:reset';

export interface CameraEventPayloadMap {
  'camera:zoom:start': CameraTransform;
  'camera:zoom:end': CameraTransform;
  'camera:shake:start': Required<Pick<ShakeOptions, 'intensity' | 'duration'>>;
  'camera:shake:end': void;
  'camera:reset': CameraTransform;
}

export interface CameraEffectsContext {
  getViewportSize(): { width: number; height: number };
  getSquareBounds(square: string): { x: number; y: number; size: number } | null;
  requestRender(): void;
  emit?<K extends CameraEvent>(event: K, payload: CameraEventPayloadMap[K]): void;
}
