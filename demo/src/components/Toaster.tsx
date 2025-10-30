import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastIntent = 'info' | 'success' | 'error';

export interface ToastOptions {
  intent?: ToastIntent;
  duration?: number;
}

interface ToastInstance {
  id: number;
  message: string;
  intent: ToastIntent;
}

interface ToasterContextValue {
  pushToast: (message: string, options?: ToastOptions) => number;
  dismissToast: (id: number) => void;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);

const DEFAULT_TOAST_DURATION = 3600;
const MAX_TOASTS = 3;

const useIsBrowser = (): boolean => globalThis.window !== undefined;

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());
  const idRef = useRef(0);
  const isBrowser = useIsBrowser();

  const dismissToast = useCallback(
    (id: number) => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
      if (timeoutsRef.current.size === 0) {
        return;
      }
      const timeoutId = timeoutsRef.current.get(id);
      if (typeof timeoutId === 'number' && isBrowser) {
        globalThis.clearTimeout(timeoutId);
      }
      timeoutsRef.current.delete(id);
    },
    [isBrowser],
  );

  const pushToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = idRef.current + 1;
      idRef.current = id;
      const intent: ToastIntent = options?.intent ?? 'info';
      const duration = options?.duration ?? DEFAULT_TOAST_DURATION;

      setToasts((previous) => {
        const next = [...previous, { id, message, intent }];
        if (next.length > MAX_TOASTS) {
          next.shift();
        }
        return next;
      });

      if (duration > 0 && isBrowser) {
        const timeoutId = globalThis.setTimeout(() => {
          dismissToast(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [dismissToast, isBrowser],
  );

  const contextValue = useMemo<ToasterContextValue>(
    () => ({
      pushToast,
      dismissToast,
    }),
    [pushToast, dismissToast],
  );

  return (
    <ToasterContext.Provider value={contextValue}>
      {children}
      <div className="playground__toaster" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`playground__toast playground__toast--${toast.intent}`}
            role="status"
          >
            <span className="playground__toast-message">{toast.message}</span>
            <button
              type="button"
              className="playground__toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToasterContext.Provider>
  );
};

export const useToaster = (): ToasterContextValue => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider');
  }
  return context;
};

export default ToasterProvider;
