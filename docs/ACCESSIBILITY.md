# Accessibility & keyboard navigation

## Assumed product priorities (plan defaults)

- **Keyboard-first / fast paths**: predictable focus order, non-drag alternatives for reorder and assign.
- **Mobile**: larger drag hit targets; assign UI available on all viewports; workspace drawer remains the small-screen entry.

## Implemented (P0)

- **Reorder without drag**: Move up / Move down on each affiliation and author row (visible buttons, screen-reader labels).
- **Assign without drag**: “Link affiliation” select on every viewport when the pool has institutions (not only narrow screens).
- **Drag handles**: `tabIndex={-1}` so Tab skips handles; use move buttons or assign dropdown for keyboard workflows.
- **Resize splitter**: keyboard-adjustable (Arrow Up / Down) when the splitter is focused.
- **Export disabled state**: visible `role="status"` message plus `aria-describedby` on export buttons when disabled.
- **HKU builder**: `aria-describedby` links the keyword field to persistent keyboard instructions.
- **Help dialog**: **Shift+?** (when not typing in an input) or header control opens keyboard & interaction notes.
- **Reduced motion**: ambient blobs use `motion-reduce:animate-none` (Tailwind).

## Backlog (nice-to-have)

- Optional **live region** for preview updates (off by default; can annoy screen-reader users).
- Deeper **screen reader** audits (NVDA/VoiceOver) for list semantics and author–affiliation relationships.
- **Automated** keyboard-path tests beyond smoke render.
- **Enter = DIY** when zero HKU matches (needs explicit UX sign-off to avoid accidental adds).

## Manual smoke checklist (release)

1. Tab through header → sidebar (Add Author, search, rows, move buttons, link select) → builder tabs → settings toggle → preview → export.
2. With export disabled: screen reader or inspect sees status text; buttons reference it via `aria-describedby`.
3. Add two affiliations; use **only** move buttons to swap order; confirm preview numbering updates.
4. Add two authors; reorder with move buttons; assign via **Link affiliation** without drag.
5. Focus splitter; Arrow Up/Down changes affiliation/authors panel split.
6. **Shift+?** opens help; Escape closes. Typing `?` inside an input does not open help.
7. Enable OS “reduce motion”; confirm blob pulsing stops.
