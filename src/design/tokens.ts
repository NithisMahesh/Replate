/**
 * Design tokens for Replate.
 * All UI components must reference these constants instead of hard-coding
 * Tailwind class strings directly, so a single edit here propagates everywhere.
 *
 * Color semantics — NEVER deviate:
 *   primary  -> emerald  — the one main action on a screen
 *   done     -> green    — completed / safe
 *   waiting  -> amber    — needs attention / pending
 *   urgent   -> red      — failed / excluded / overdue
 *   progress -> blue     — in-flight / being processed
 *   neutral  -> slate    — backgrounds, borders, secondary text
 */

// ---------------------------------------------------------------------------
// Primary action — emerald
// ---------------------------------------------------------------------------
export const primary = {
  /** Filled button background */
  bg: 'bg-emerald-600',
  /** Filled button text */
  text: 'text-white',
  /** Hover state */
  hover: 'hover:bg-emerald-700',
  /** Focus ring */
  focus: 'focus-visible:ring-emerald-500',
  /** Ghost / outline accent */
  outline: 'border-emerald-600 text-emerald-700',
  /** Light tint for backgrounds */
  tint: 'bg-emerald-50 text-emerald-800',
} as const;

// ---------------------------------------------------------------------------
// Status colors — fixed semantic meaning
// ---------------------------------------------------------------------------
export const status = {
  /** done / safe / collected / distributed */
  done: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
    icon: '✓',
    label: 'Done',
  },
  /** waiting / scheduled / pending NGO action */
  waiting: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    icon: '⏳',
    label: 'Waiting',
  },
  /** urgent / failed / excluded / overdue */
  urgent: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
    icon: '✕',
    label: 'Urgent',
  },
  /** in progress / confirmed / being handled */
  progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
    icon: '↻',
    label: 'In Progress',
  },
} as const;

export type StatusKey = keyof typeof status;

// ---------------------------------------------------------------------------
// Neutral — slate
// ---------------------------------------------------------------------------
export const neutral = {
  /** Page background */
  pageBg: 'bg-slate-50',
  /** Card / surface background */
  cardBg: 'bg-white',
  /** Subtle divider */
  border: 'border-slate-200',
  /** Secondary / muted text */
  muted: 'text-slate-500',
  /** Primary body text */
  body: 'text-slate-800',
  /** Strong headings */
  heading: 'text-slate-900',
} as const;

// ---------------------------------------------------------------------------
// Type scale (font-size + line-height pairs as Tailwind classes)
// Minimum sizes per spec: title 24, heading 18, body 16, caption 12
// ---------------------------------------------------------------------------
export const type = {
  /** 24 px — screen / section title */
  title: 'text-2xl font-bold leading-tight',
  /** 18 px — card heading */
  heading: 'text-lg font-semibold leading-snug',
  /** 16 px — body copy */
  body: 'text-base leading-relaxed',
  /** 14 px — secondary information */
  small: 'text-sm leading-normal',
  /** 12 px — captions, timestamps, labels */
  caption: 'text-xs leading-normal',
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------
export const radius = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------
export const shadow = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (Tailwind p-/m- shorthands kept as constants for reference)
// ---------------------------------------------------------------------------
export const space = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const;

// ---------------------------------------------------------------------------
// Touch target — 44 px minimum per Fitts Law / WCAG 2.5.5
// ---------------------------------------------------------------------------
export const touch = {
  /** Apply to every interactive element */
  min: 'min-h-[44px] min-w-[44px]',
} as const;
