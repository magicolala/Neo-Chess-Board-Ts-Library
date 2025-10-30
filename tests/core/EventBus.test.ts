import { EventBus } from '../../src/core/EventBus';

interface TestEvents {
  test: { message: string; value: number };
  empty: void;
  multiple: string;
  [event: string]: unknown;
}

describe('EventBus', () => {
  let eventBus: EventBus<TestEvents>;

  beforeEach(() => {
    eventBus = new EventBus<TestEvents>();
  });

  describe('on/off/emit', () => {
    it('should register and emit events correctly', () => {
      const handler = jest.fn();
      eventBus.on('test', handler);

      const payload = { message: 'hello', value: 42 };
      eventBus.emit('test', payload);

      expect(handler).toHaveBeenCalledWith(payload);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners for the same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('multiple', handler1);
      eventBus.on('multiple', handler2);

      eventBus.emit('multiple', 'test message');

      expect(handler1).toHaveBeenCalledWith('test message');
      expect(handler2).toHaveBeenCalledWith('test message');
    });

    it('should remove specific listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('multiple', handler1);
      eventBus.on('multiple', handler2);
      eventBus.off('multiple', handler1);

      eventBus.emit('multiple', 'test message');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('test message');
    });

    it('should return unsubscribe function from on()', () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.on('test', handler);

      eventBus.emit('test', { message: 'before', value: 1 });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit('test', { message: 'after', value: 2 });
      expect(handler).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should handle events with void payloads', () => {
      const handler = jest.fn();
      eventBus.on('empty', handler);

      eventBus.emit('empty', void 0);

      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should handle errors in event handlers gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorHandler = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();

      eventBus.on('test', errorHandler);
      eventBus.on('test', normalHandler);

      eventBus.emit('test', { message: 'test', value: 1 });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(normalHandler).toHaveBeenCalled(); // Should still be called

      consoleSpy.mockRestore();
    });

    it('should handle removing non-existent listeners gracefully', () => {
      const handler = jest.fn();

      // Should not throw
      expect(() => {
        eventBus.off('test', handler);
      }).not.toThrow();
    });
  });
});
