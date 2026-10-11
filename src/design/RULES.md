# Replate Design Rulebook

> One source of truth for every UI decision. Read this before touching any screen.
> Last section: a 10-question review checklist — run it on every screen before merging.

---

## 1. Progressive Disclosure
- Show the **summary first**; hide details behind an expand or a sheet.
- Collapsed content is still in the DOM — never delete data to save space.
- Reveal the next step only after the current one is complete.
- Maximum one level of nesting (summary → detail). No detail-inside-detail.

---

## 2. Visual Hierarchy
- **One primary action per screen.** The emerald filled button is the only high-contrast element.
- Everything else is secondary (outlined) or ghost (text only).
- The eye should land on the primary action within 200 ms without scanning.
- Use size, weight, and whitespace — not extra color — to create hierarchy.

---

## 3. Choices per Card
| Slot | Style | Max count |
|------|-------|-----------|
| Primary action | Filled emerald button | **1** |
| Secondary actions | Outlined or ghost buttons | **2** |
| Overflow actions | "More ···" menu / bottom sheet | Unlimited |

Never show more than 3 visible buttons on a single card.
Extras go in a `···` menu so Hick's Law is respected.

---

## 4. Information Density
- Show **3–5 facts** per card. More goes behind "Show details".
- Facts ranked by user decision priority: status → quantity → deadline → location → contact.
- Timestamps are relative when < 24 h old ("2 h ago"), absolute otherwise ("Oct 11, 14:30").
- Numbers: use local comma formatting (`1,200 meals`, not `1200 meals`).

---

## 5. Color Meaning
Color alone is never the only signal — always pair with an **icon or short label**.

| Color | Token key | Meaning | Icon |
|-------|-----------|---------|------|
| Green | `done` | Completed · Safe · Collected · Distributed | ✓ |
| Amber | `waiting` | Pending · Scheduled · Needs action | ⏳ |
| Red | `urgent` | Failed · Excluded · Expired · Overdue | ✕ |
| Blue | `progress` | Confirmed · In transit · Being processed | ↻ |
| Emerald | `primary` | The one main action on this screen | — |

Import `status` from `./tokens` and use `StatusChip` — never write raw color classes for status.

---

## 6. Text
- **Body text minimum: 14 px** (`text-sm` or larger).
- **Caption minimum: 12 px** (`text-xs`) — use only for timestamps and labels.
- Sentences: **under 12 words**. Split longer sentences.
- Button labels: **verb + object** — "Confirm Pickup", "Cancel Donation", not "OK" or "Submit".
- Avoid jargon. No abbreviations that a volunteer seeing the app for the first time wouldn't know.
- Support **Tamil and English**. All labels must have `i18n` keys; no hard-coded English strings in JSX.

---

## 7. Feedback
- Every tap/click must produce a **visible change within 200 ms** (optimistic UI or spinner).
- Three required states for every async action: **loading → success → error**.
- Use `Toast` for non-blocking confirmations ("Pickup confirmed ✓").
- Use inline error text (red, `text-xs`, below the field) for form validation.
- Never show a blank screen during loading — use a skeleton or spinner.

---

## 8. Error Prevention
- Disable actions that are not currently valid.
- A disabled button **must show a tooltip or inline note** explaining why (e.g., "Add at least one meal first").
- Destructive actions (cancel, delete, exclude) require a **confirmation step** before executing.
- Use input constraints (type, min, max, pattern) to block bad data before submission.

---

## 9. Forgiveness
- **Undo** must be available for at least 5 seconds after any Cancel or Delete action (via Toast with "Undo" link).
- Soft-delete first; hard-delete only after the undo window closes.
- Never navigate away automatically after a destructive action without giving the user a chance to stop it.

---

## 10. Accessibility
- **Touch targets: 44 × 44 px minimum** (`min-h-[44px] min-w-[44px]`) on every interactive element.
- **Focus rings** visible on keyboard navigation (`focus-visible:ring-2`). Never `outline: none` without a custom ring.
- **aria-label** on icon-only buttons. **role="status"** on chips and live regions.
- **Contrast: 4.5 : 1 minimum** for body text; 3 : 1 for large text and UI components.
- All screens readable in **Tamil (`ta`) and English (`en`)**; language toggle in settings.
- Do not rely on hover alone — all information reachable by tap or keyboard.

---

## 11. Trust Cues
Every piece of user-generated data must carry one of these badges:

| Badge | When to show |
|-------|--------------|
| ✅ **Verified** | Confirmed by an NGO or a matching pickup event |
| ⚠️ **Unverified** | Provider self-reported, not yet confirmed |
| ~ **Estimate** | Quantity or time is approximate (provider flagged it) |
| 🕐 **Last updated** + timestamp | Any value that changes over time (quantity, status) |

Never show a number without a trust cue when accuracy affects a decision.

---

## Screen Review Checklist

Run these 10 questions on every screen before merging. All answers must be **Yes**.

| # | Question | Yes / No |
|---|----------|----------|
| 1 | Is there exactly **one** filled primary button visible? | |
| 2 | Are there **≤ 2** secondary buttons, with extras in a More menu? | |
| 3 | Does every status chip show **both** a color and an icon/label? | |
| 4 | Does every async action show **loading, success, and error** states? | |
| 5 | Are all touch targets **≥ 44 × 44 px**? | |
| 6 | Do all disabled buttons have a **visible reason**? | |
| 7 | Is **undo** available after any cancel or delete? | |
| 8 | Are all strings using **i18n keys** (no hard-coded English in JSX)? | |
| 9 | Does the screen pass **4.5 : 1 contrast** for body text? | |
| 10 | Are all data values accompanied by a **trust cue** (Verified / Unverified / Estimate / Last updated)? | |
