import Link from 'next/link';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import { cn } from './cn';
import type { IconType } from './icon';
import { Spinner } from './Spinner';

/**
 * primary    ink (cream in dark mode): the one main action in a view
 * secondary  bordered neutral: supporting actions
 * ghost      no chrome until hover: toolbar and row actions
 * tertiary   accent text link that still behaves like a button
 * danger     destructive confirmation
 * inverse    cream-on-ink, for use on the ink surface
 * accent     court green, reserved for marketing sign-up actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'danger' | 'inverse' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconType;
  /** Icon after the label, for "continue" style buttons. */
  trailingIcon?: IconType;
  loading?: boolean;
  /** Stretch to fill the parent row. */
  block?: boolean;
  /** Render as a link (in-app navigation that can open in a new tab). */
  href?: string;
  /** Show only the icon; the label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
  onPress?: () => void;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  secondary: 'border border-border-strong bg-surface text-text hover:bg-surface-muted',
  ghost: 'text-text hover:bg-surface-muted',
  tertiary: 'text-accent hover:underline px-1!',
  danger: 'bg-danger text-on-accent hover:opacity-90',
  inverse: 'bg-on-ink text-ink hover:opacity-90',
  accent: 'bg-accent text-on-accent hover:opacity-90',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 t-label',
  md: 'h-9 gap-2 px-3.5 t-text-strong',
  lg: 'h-11 gap-2 px-5 t-text-strong text-[15px]',
};
const ICON_ONLY: Record<ButtonSize, string> = { sm: 'h-8 w-8 px-0', md: 'h-9 w-9 px-0', lg: 'h-11 w-11 px-0' };

export function buttonClass({ variant = 'primary', size = 'md', block, iconOnly, disabled }: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; iconOnly?: boolean; disabled?: boolean }) {
  return cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-control transition-[background-color,opacity,box-shadow] duration-100',
    SIZE[size],
    iconOnly && ICON_ONLY[size],
    VARIANT[variant],
    // A block button fills its row but may shrink to share it; otherwise buttons keep their size.
    block ? 'w-full min-w-0' : 'shrink-0',
    disabled && 'pointer-events-none opacity-45',
  );
}

export function Button({ label, variant = 'primary', size = 'md', icon: Icon, trailingIcon: Trailing, loading, disabled, block, href, iconOnly, onPress, className, type = 'button', ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 18 : 16;
  const content = (
    <>
      {loading ? <Spinner size={iconSize} /> : Icon && <Icon size={iconSize} weight="bold" className="shrink-0" aria-hidden />}
      {!iconOnly && <span className="truncate">{label}</span>}
      {Trailing && !loading && !iconOnly && <Trailing size={iconSize} weight="bold" className="shrink-0" aria-hidden />}
    </>
  );
  const cls = cn(buttonClass({ variant, size, block, iconOnly, disabled: isDisabled && !loading }), loading && 'cursor-progress', className);

  if (href && !isDisabled) {
    return (
      <Link href={href} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined} className={cls} onClick={onPress as ((e: MouseEvent) => void) | undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} aria-label={iconOnly ? label : rest['aria-label']} title={iconOnly ? label : undefined} aria-busy={loading || undefined} disabled={isDisabled} onClick={onPress} {...rest} className={cls}>
      {content}
    </button>
  );
}
