# Modals

Which modal a surface reaches for, and what each one promises. A form inside one fails the way
`docs/features/forms.md` says.

## Which one

- **`Modal` (`src/shared/components/Modal/`) is the one a User may walk away from** — `Escape` and
  a click past it close. A form, a preview, a one-button notice.
- **`AlertModal` (`src/shared/components/AlertModal/`) is the one that must be answered** —
  `role="alertdialog"`, `Escape` alone closes, focus opens on `Cancel`. A question with a
  consequence.
- **`ConfirmDialog` (`src/shared/components/ConfirmDialog/`) is the yes/no case on `AlertModal`**,
  built from `title` and `onConfirm`. It closes on confirm; a write that fails afterwards reports
  through the rollback and toast the form layer owns, never by reopening.
- **`DestructiveButton confirm={…}` is `ConfirmDialog` behind a delete** — `onClick` fires only
  after the User confirms, and the button is `type="button"` so a form around it never submits
  past the question. Without `confirm` the button is unchanged.

## The contract

- **Controlled only.** `open` and `onOpenChange` are the parent's; there is no trigger slot, so
  the same shape holds when a router owns the state.
- **`Title` is required**, and a modal with no visible heading passes `isSrOnly` rather than an
  `aria-label` — Radix labels the panel by it. `Description`, when present, describes it.
- **Both families share the parts** — `Header`, `Title`, `Description`, `Body`, `Footer`,
  `Action`, and `Close` (`Modal`) or `Cancel` (`AlertModal`). One button, two buttons, no visible
  header: composition, not props. `Action tone="destructive"` changes color alone.
- **`Modal.Action` does not close; `AlertModal.Action` does** unless its `onClick` prevents
  default. A form modal's affirmative control is `Form.Submit`, and a write that must hold the
  question open on failure prevents default.
- **Every label is a prop or a child** (`<standards>/i18n.md`) — the page words `Close` and
  `Cancel` itself. `ConfirmDialog` alone has a default: `confirmLabel` and `cancelLabel` fall back
  to the `modal` vocabulary, and a page that wants "Delete" passes it.
- **`size` is `sm` | `md` | `lg`**, `md` by default; below `sm:` every size fills the viewport
  minus the gutter. Widths are Tailwind's `max-w-sm` | `lg` | `2xl` in
  `src/shared/lib/modalPanel.ts`.

## A form inside

`Form.Root` wraps `Modal.Body` and `Modal.Footer` together; the fields and `Form.Error` sit in
the body, `Form.Actions` in the footer. The kit carries no error slot of its own, so a field, a
footer and a toast failure land exactly where `forms.md` sends them. **The hook is called in a
component mounted inside the modal** — Radix unmounts the panel on close, so the draft and its
errors go with it; called in the page, they come back on reopen.

## Focus and motion

- **Focus returns to whatever opened the modal**, held by `useReturnToOpener` in
  `src/shared/hooks/` — Radix returns it only through its own `Trigger`, which the kit does not
  render. Any future controlled overlay without a trigger spreads the same pair onto its Content.
- **Open and close run on `--dur-slow`** in `src/styles/shadcn-adapter.css`, and stop under the
  reduced-motion lever `globals.css` already pulls; no `motion-reduce:` is written.
- **The filament frame is `ModalFrame`**, the first child of both panels: two corner vines,
  `aria-hidden`, drawn in `dark-fantasy` and nothing in `standard`, read from the route's
  `[theme]` segment. Its marks are
  `design/marks.md`; the ring between them is the component's own; the overlay's wash is
  `--wash-modal`. Its own motion runs inside the SVG files under `prefers-reduced-motion:
  no-preference`.

## Testing

The seam is the public props; `tests/shared/components/{Modal,AlertModal,ConfirmDialog,DestructiveButton}.test.tsx`
open, close, read roles and names, and never reach into Radix or `ui/`.
