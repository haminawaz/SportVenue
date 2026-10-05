import type { ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';

/** Any Phosphor icon component. Icons inherit colour from the surrounding text (currentColor). */
export type IconType = ComponentType<IconProps>;
