import type { ElementType, HTMLAttributes } from 'react';

import type { TypographyVariant } from '@/theme/tokens';

import { cn } from './cn';

export type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'warning' | 'danger' | 'onAccent';

const TONE: Record<Tone, string> = {
  default: 'text-text',
  muted: 'text-text-muted',
  subtle: 'text-text-subtle',
  accent: 'text-accent',
  warning: 'text-warning',
  danger: 'text-danger',
  onAccent: 'text-on-accent',
};

const VARIANT: Record<TypographyVariant, string> = {
  'display-mega': 't-display-mega',
  'display-xl': 't-display-xl',
  'display-lg': 't-display-lg',
  'display-md': 't-display-md',
  'display-sm': 't-display-sm',
  'title-md': 't-title-md',
  'title-sm': 't-title-sm',
  'body-md': 't-body-md',
  'body-strong': 't-body-strong',
  'body-sm': 't-body-sm',
  caption: 't-caption',
  'caption-uppercase': 't-caption-uppercase',
  button: 't-button',
  'nav-link': 't-nav-link',
  'page-title': 't-page-title',
  stat: 't-stat',
  heading: 't-heading',
  text: 't-text',
  'text-strong': 't-text-strong',
  small: 't-small',
  label: 't-label',
  mini: 't-mini',
  overline: 't-overline',
};

/** Static class names so Tailwind can see them; 0 means no clamp. */
const CLAMP: Record<number, string> = { 1: 'truncate', 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' };

export type AppTextProps = HTMLAttributes<HTMLElement> & {
  variant?: TypographyVariant;
  tone?: Tone;
  /** Tabular figures so numbers do not jitter between refreshes. */
  numeric?: boolean;
  /** Truncate after this many lines (1 to 4). */
  lines?: number;
  /** Render inline, for text nested inside other text. */
  inline?: boolean;
  as?: ElementType;
  /** When rendered as a <label>. */
  htmlFor?: string;
};

export function AppText({ variant = 'text', tone = 'default', numeric, lines, inline, as: Tag = 'span', className, ...rest }: AppTextProps) {
  return (
    <Tag
      {...rest}
      className={cn(inline ? 'inline' : 'block', 'min-w-0 break-words', VARIANT[variant], TONE[tone], numeric && 'tabular-nums', lines ? CLAMP[lines] : undefined, className)}
    />
  );
}
