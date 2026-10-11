import React from 'react';

export interface CardProps {
  /** Extra Tailwind classes to merge in (e.g. custom padding or border) */
  className?: string;
  children: React.ReactNode;
  /** Makes the card a pressable surface (adds hover + active states) */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** aria-label for pressable cards */
  ariaLabel?: string;
}

/**
 * Card
 *
 * A white, rounded surface with a soft shadow. The single base container
 * for all content blocks in the app.
 *
 * Rules:
 * - Use `onClick` only when the entire card is the primary tap target.
 * - Keep padding consistent (p-4 default); override via `className` if needed.
 * - Never nest a Card inside another Card.
 */
export const Card: React.FC<CardProps> = ({
  className = '',
  children,
  onClick,
  ariaLabel,
}) => {
  const interactive = onClick !== undefined;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={[
        'bg-white rounded-xl shadow-sm border border-slate-200',
        'p-4',
        interactive
          ? 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-all duration-150'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export default Card;
