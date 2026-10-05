'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import { useAppRouter } from '@/navigation/useAppRouter';

import { AppText } from './AppText';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { useDocumentTitle } from './LargeTitle';
import { RefreshButton } from './Refresh';
import { useScrolled } from './useScrolled';

type StackHeaderProps = {
  title: string;
  /** Action on the right, for example Edit. */
  headerRight?: ReactNode;
  /** Screens that draw their own pinned title hide this bar. */
  headerShown?: boolean;
};

/**
 * The navigation bar for screens pushed on top of the tabs, standing in for
 * the native stack header: back button, centred title, optional action. It
 * also names the browser tab after the screen.
 */
export function StackHeader({ title, headerRight, headerShown = true }: StackHeaderProps) {
  const router = useAppRouter();
  const scrolled = useScrolled();
  useDocumentTitle(title);

  if (!headerShown) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/85',
        scrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto grid h-14 w-full max-w-[760px] grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center gap-2 px-2">
        <div className="flex items-center">
          <IconButton icon={ArrowLeft} label="Back" onPress={() => router.back()} size="sm" />
        </div>
        <AppText as="h1" variant="title-md" lines={1} className="text-center">
          {title}
        </AppText>
        <div className="flex items-center justify-end gap-1">
          <RefreshButton />
          {headerRight}
        </div>
      </div>
    </header>
  );
}
