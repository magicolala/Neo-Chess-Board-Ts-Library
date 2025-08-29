export class EventBus<T extends Record<string, any>> {
  private map = new Map<keyof T, Set<(p: T[keyof T]) => void>>();
  on<K extends keyof T>(type: K, fn: (p: T[K]) => void) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(fn as any);
    return () => this.off(type, fn as any);
  }
  off<K extends keyof T>(type: K, fn: (p: T[K]) => void) {
    this.map.get(type)?.delete(fn as any);
  }
  emit<K extends keyof T>(type: K, payload: T[K]) {
    this.map.get(type)?.forEach((fn) => {
      try {
        (fn as any)(payload);
      } catch (e) {
        console.error(e);
      }
    });
  }
}
