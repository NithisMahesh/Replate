import React from 'react';
import { touch } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables interaction while true */
  loading?: boolean;
  /** Full-width block button */
  full?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  /**
   * Primary — the ONE filled action on a screen. Emerald background.
   * Only one primary button should exist per view (Hick's Law).
   */
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
    'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',

  /**
   * Secondary — supporting action. Outlined, no fill so it never competes
   * visually with the single primary action.
   */
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ' +
    'active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',

  /**
   * Ghost — lowest-hierarchy action (e.g. Cancel, Back). No border, no fill.
   */
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 ' +
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',

  /**
   * Danger — destructive or irreversible action. Red to signal risk.
   * Pair with a confirmation step for non-undoable operations.
   */
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
    'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
};

/**
 * Button
 *
 * Rules enforced:
 * - Minimum 44 px height (Fitts's Law / WCAG 2.5.5).
 * - Only one `primary` button per screen — callers are responsible for this.
 * - `loading` prop prevents double-submit and shows a spinner.
 * - All variants have visible focus rings for keyboard navigation.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  full = false,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        // Layout
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2.5',
        touch.min,
        full ? 'w-full' : '',
        // Typography
        'text-sm font-semibold',
        // Shape
        'rounded-lg',
        // Transition
        'transition-colors duration-150',
        // Disabled
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        // Variant
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-busy={loading}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
