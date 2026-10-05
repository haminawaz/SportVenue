'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { cn } from './cn';
import { Portal } from './Overlay';

type ToastKind = 'success' | 'error';
type ToastMessage = { id: number; kind: ToastKind; text: string };

type ToastApi = { show: (text: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

const VISIBLE_MS = 3200;
const EXIT_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, kind, text });
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const done = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && <ToastView key={toast.id} toast={toast} onDone={done} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const remove = setTimeout(onDone, VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDone]);

  const Icon = toast.kind === 'success' ? CheckCircle : WarningCircle;

  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-[100] flex justify-center">
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            'flex max-w-[480px] animate-toast-in items-center gap-3 rounded-card bg-text px-5 py-4 shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-200',
            leaving && 'translate-y-3 opacity-0',
          )}
        >
          <Icon size={24} weight="fill" className={cn('shrink-0', toast.kind === 'success' ? 'text-accent' : 'text-danger')} />
          <AppText variant="body-strong" className="text-background">
            {toast.text}
          </AppText>
        </div>
      </div>
    </Portal>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
