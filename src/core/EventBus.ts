type ListenerValue<T> = (payload: T[keyof T]) => void;

export class EventBus<T extends Record<string, unknown>> {
  private map = new Map<keyof T, Set<ListenerValue<T>>>();
  on<K extends keyof T>(type: K, fn: (p: T[K]) => void) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(fn as ListenerValue<T>);
    return () => this.off(type, fn);
  }
  off<K extends keyof T>(type: K, fn: (p: T[K]) => void) {
    this.map.get(type)?.delete(fn as ListenerValue<T>);
  }
  emit<K extends keyof T>(type: K, payload: T[K]) {
    this.map.get(type)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error(e);
      }
    });
  }
}
