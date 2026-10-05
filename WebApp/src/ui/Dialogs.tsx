'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { Button } from './Button';
import { cn } from './cn';
import { Portal, useModalBehavior } from './Overlay';

type ModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons for the footer, right-aligned. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  role?: 'dialog' | 'alertdialog';
};

const SIZE = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[720px]' };

/** A centred dialog with a title bar, scrollable body and a footer for actions. */
export function Modal({ visible, title, description, onClose, children, footer, size = 'md', role = 'dialog' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useModalBehavior(visible, panelRef, onClose);
  if (!visible) return null;
  return (
    <Portal>
      <div data-overlay className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
        <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 animate-fade-in bg-backdrop" onClick={onClose} />
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'relative flex max-h-[92dvh] w-full animate-pop-in flex-col rounded-t-hero bg-surface shadow-raised outline-none sm:max-h-[85dvh] sm:rounded-hero',
            SIZE[size],
          )}
        >
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <AppText as="h2" id={titleId} variant="heading" className="text-base">
                {title}
              </AppText>
              {description && (
                <AppText as="p" id={descId} variant="small" tone="muted">
                  {description}
                </AppText>
              )}
            </div>
            {role === 'dialog' && (
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-1 rounded-[8px] p-1.5 text-text-muted hover:bg-surface-muted hover:text-text">
                <X size={17} />
              </button>
            )}
          </div>
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra inputs, for example a reason picker. */
  children?: ReactNode;
};

/** Asks before a consequential action; Escape or the backdrop cancels. */
export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel = 'Keep', destructive, loading, onConfirm, onCancel, children }: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      title={title}
      description={message}
      onClose={onCancel}
      size="sm"
      role="alertdialog"
      footer={
        <>
          <Button label={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} />
          <Button label={confirmLabel} onPress={onConfirm} loading={loading} variant={destructive ? 'danger' : 'primary'} />
        </>
      }
    >
      {children}
    </Modal>
  );
}

/** A panel that slides in from the side (navigation on small screens). */
export function Drawer({ visible, title, onClose, children, side = 'left' }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; side?: 'left' | 'right' }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalBehavior(visible, panelRef, onClose);
  if (!visible) return null;
  return (
    <Portal>
      <div data-overlay className="fixed inset-0 z-[60] flex">
        <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 animate-fade-in bg-backdrop" onClick={onClose} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn('relative flex h-full w-[min(300px,86vw)] flex-col bg-surface-raised shadow-raised outline-none animate-fade-in', side === 'right' && 'ml-auto')}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
