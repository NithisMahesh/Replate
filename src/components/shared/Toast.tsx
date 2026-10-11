import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    action?: { label: string; onClick: () => void },
    durationMs?: number
  ) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  undo: (message: string, onUndo: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      action?: { label: string; onClick: () => void },
      durationMs: number = 3500
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message, action }]);
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const undo = useCallback(
    (msg: string, onUndo: () => void) => {
      showToast(msg, 'info', { label: 'Undo', onClick: onUndo }, 5000);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, undo }}>
      {children}
      {/* Toast container floating on screen */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-slate-900 border-amber-600'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="h-4 w-4 shrink-0" />}
              {toast.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
              <span className="text-xs sm:text-sm font-medium leading-snug break-words">
                {toast.message}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/20 hover:bg-white/30 text-white underline cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/15 transition-colors duration-150 shrink-0 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg: string) => console.log('[Toast]', msg),
      success: (msg: string) => console.log('[Toast Success]', msg),
      error: (msg: string) => console.log('[Toast Error]', msg),
      info: (msg: string) => console.log('[Toast Info]', msg),
      undo: (_msg: string, onUndo: () => void) => onUndo(),
    };
  }
  return context;
}
