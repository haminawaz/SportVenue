import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { Button } from './Button';
import { cn } from './cn';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Without its own card frame (when shown inside a card or table). */
  plain?: boolean;
};

export function ErrorState({ title, message, onRetry, retrying, plain }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 px-6 py-12 text-center', !plain && 'surface-card')}>
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircle size={22} aria-hidden />
      </span>
      <AppText variant="text-strong">{title}</AppText>
      <AppText variant="small" tone="muted" className="max-w-[420px]">
        {message}
      </AppText>
      {onRetry && (
        <div className="mt-3">
          <Button label="Try again" icon={ArrowClockwise} variant="secondary" onPress={onRetry} loading={retrying} />
        </div>
      )}
    </div>
  );
}
