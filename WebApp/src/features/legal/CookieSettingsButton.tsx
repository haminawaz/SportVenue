'use client';

import { Cookie } from '@phosphor-icons/react';

import { Button, type ButtonVariant } from '@/ui/Button';
import { cn } from '@/ui/cn';

import { useOpenCookieSettings } from './CookieConsent';

/** Opens the cookie settings dialog, as a button or as a footer-style text link. */
export function CookieSettingsButton({ variant = 'secondary', asLink, className }: { variant?: ButtonVariant; asLink?: boolean; className?: string }) {
  const open = useOpenCookieSettings();
  if (asLink) {
    return (
      <button type="button" onClick={open} className={cn('text-left', className)}>
        Cookie settings
      </button>
    );
  }
  return <Button label="Cookie settings" icon={Cookie} variant={variant} onPress={open} className={className} />;
}
