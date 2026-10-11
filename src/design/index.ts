/**
 * src/design/index.ts
 *
 * Single entry-point for all design-system exports.
 * Import from here, not from individual files:
 *
 *   import { Button, Card, StatusChip, primary, status, type StatusKey } from '../design';
 */

// Tokens
export * from './tokens';

// Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { StatusChip } from './StatusChip';
export type { StatusChipProps } from './StatusChip';
