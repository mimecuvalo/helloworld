import type { ReactElement, ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import styles from './Tooltip.module.css';

/**
 * Hover/focus text for `children`, in place of a native `title` attribute.
 *
 * The child is rendered as-is with the trigger's handlers merged onto it, so
 * it can be any element that takes a ref — a button, a link, an image.
 *
 * Unlike `title`, this gives the trigger no accessible name. An icon-only
 * button still needs its own `aria-label`.
 */
export default function Tooltip({
  label,
  side = 'top',
  children,
}: {
  // Nothing to show renders the child alone, so callers can pass an optional
  // value straight through.
  label: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement;
}) {
  if (label == null || label === '' || label === false) return children;

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={styles.positioner} side={side} sideOffset={6}>
          <BaseTooltip.Popup className={styles.popup}>{label}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

// Shares one warm-up across every tooltip: once one has opened, moving to the
// next (along a row of action buttons, say) shows it straight away.
export const TooltipProvider = BaseTooltip.Provider;
