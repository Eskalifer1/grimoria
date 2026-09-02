# WCAG 2.2 AA checklist

Every Level A and AA success criterion in WCAG 2.2, and what each one means for a React diff in this
repo. `SKILL.md` names the eleven categories; this file is what a category is checked against.

Three tables: **in scope** — report a finding; **held elsewhere** — a gate, a token or a browser
already covers it, so a finding here means that gate is broken; **not reachable** — nothing in this
repo can break it.

A finding cites the number and the name from the first table verbatim.

## In scope — report these

### 1. Semantics and structure

| SC | Look for |
| --- | --- |
| 1.3.1 Info and Relationships | Visual grouping with no markup behind it — a list of `div`s, a caption not in `figcaption`, a fieldset of radios with no `fieldset`/`legend`, a table with no `th`. |
| 1.3.2 Meaningful Sequence | DOM order differs from reading order — `order`, `flex-direction: *-reverse`, `grid-area`, or absolute positioning that moves content past what precedes it. |
| 2.4.6 Headings and Labels | A heading or label that does not describe what follows it; heading levels skipping down, or a second `h1` on one page. |

### 2. Accessible name

| SC | Look for |
| --- | --- |
| 1.1.1 Non-text Content | An image, icon or chart with no `alt`, or a decorative one missing `alt=""`. An icon inside a labelled button still needs `aria-hidden`. |
| 2.4.4 Link Purpose (In Context) | A link whose name is "here", "read more" or a bare URL, with nothing near it that supplies the destination. |
| 2.5.3 Label in Name | An `aria-label` or `aria-labelledby` whose text does not start with the visible label. Prefer no `aria-label` over one that fights the text. |
| 4.1.2 Name, Role, Value (name half) | A name that resolves only on one branch — a prop defaulting to `undefined`, a label rendered behind a condition. |

### 3. Keyboard and focus

| SC | Look for |
| --- | --- |
| 2.1.1 Keyboard | An action reachable by pointer alone — a handler on a `div`, a hover-only menu, a control at `tabIndex={-1}` with no other route to it. |
| 2.1.2 No Keyboard Trap | Focus that enters and cannot leave with Tab or Escape — a hand-rolled focus trap with no release, an editor swallowing Tab, a listener calling `preventDefault` on every key. |
| 2.4.3 Focus Order | Focus does not move into an opened dialog or menu, or does not return to the trigger on close. A control removed under the User (dismiss, delete) drops focus to `body`. |
| 2.1.4 Character Key Shortcuts | A single-letter shortcut bound on `document` with no modifier and no way to turn it off — it fires while a User is typing. |

### 4. ARIA state

| SC | Look for |
| --- | --- |
| 4.1.2 Name, Role, Value (state half) | `aria-expanded`, `aria-current`, `aria-selected`, `aria-pressed`, `aria-checked`, `aria-invalid`, `aria-busy` missing, or true on one branch and stale on another, including the first render. A `role` assigned without the properties that role requires. |

### 5. Forms

| SC | Look for |
| --- | --- |
| 3.3.2 Labels or Instructions | A control with no `label` bound by `htmlFor`/`id`. A placeholder is not a label — it leaves on the first keystroke. A required field, a format, or a limit not stated before the User types. |
| 3.3.1 Error Identification | An error shown in color or position alone, not tied to its control by `aria-describedby`, or not `aria-invalid`. Focus does not reach the first error on a failed submit. |
| 3.3.3 Error Suggestion | An error that names the failure but not the fix — "Invalid date" where the format is knowable. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | A destructive or irreversible action — delete, publish, pay — with no confirmation step, no review, and no undo. |
| 3.3.7 Redundant Entry | A multi-step or resumable flow asking again for something the User already entered, with no prefill and no pick-from-previous. |
| 3.3.8 Accessible Authentication (Minimum) | Sign-in or sign-up that blocks paste or autofill on a password field, or requires a memory or puzzle test to pass. Password fields carry `autocomplete="current-password"` or `"new-password"`. |
| 1.3.5 Identify Input Purpose | A field collecting something about the User — name, email, address, phone, one-time code — with no `autocomplete` token. |
| 3.2.2 On Input | Changing a value alone causes a change of context — a `select` that navigates on change, a field that submits on blur, a checkbox that reloads. Announce it up front or put it behind a button. |
| 3.2.1 On Focus | Focusing a control alone opens a dialog, moves focus elsewhere, or submits. |

### 6. Dynamic content

| SC | Look for |
| --- | --- |
| 4.1.3 Status Messages | A region that swaps — loading, empty, error, result count, toast — with no `aria-live` or `role="status"`/`role="alert"`. The region must be mounted empty and then filled; created together with its text it is silent. One region per announcement. |
| 2.2.1 Timing Adjustable | A time limit the User cannot extend or turn off — a toast carrying an action that auto-dismisses, a session expiring with no warning, a redirect on a timer. |
| 2.2.2 Pause, Stop, Hide | Motion that starts on its own and runs over five seconds with no pause — a carousel, a marquee, a looping animation. Also: motion that ignores `prefers-reduced-motion`. |
| 1.4.13 Content on Hover or Focus | A tooltip or popover that is not dismissible with Escape, disappears when the pointer moves onto it, or vanishes before it can be read. |

### 7. Pointer and target

| SC | Look for |
| --- | --- |
| 2.5.2 Pointer Cancellation | The action fires on `onMouseDown`/`onPointerDown` instead of on click, so a User cannot slide off to abort. |
| 2.5.1 Pointer Gestures | Swipe, pinch or multi-finger paths with no single-tap equivalent. |
| 2.5.7 Dragging Movements | A drag-to-reorder, slider or drag-to-dismiss with no click or keyboard alternative doing the same thing. |
| 2.5.4 Motion Actuation | Shake, tilt or device motion as the only way to invoke something. |

### 8. Page level

| SC | Look for |
| --- | --- |
| 2.4.1 Bypass Blocks | Repeated content — header, nav — with no skip link to `main` and no landmark structure to jump by. Checked on layouts, not on every component. |
| 2.4.2 Page Titled | A route with no `metadata.title` or `generateMetadata`, or a title that does not describe the page. |
| 2.4.5 Multiple Ways | A page reachable only by one path, with no nav, search, sitemap or in-context link leading to it. Not a finding for a step inside a flow. |
| 3.2.3 Consistent Navigation | A repeated nav rendered in a different order on one route. |
| 3.2.4 Consistent Identification | The same function carrying a different name or icon across surfaces — "Delete" here, "Remove" there. |
| 3.2.6 Consistent Help | A help, contact or support entry point placed in a different spot from page to page. |

### 9. Non-visual cues

| SC | Look for |
| --- | --- |
| 1.4.1 Use of Color | State carried by color alone — a red border with no message, a colored dot with no text, a chart keyed only by hue. |
| 1.3.3 Sensory Characteristics | Copy that locates by shape or place: "the button on the right", "the round icon", "below". |

### 10. Locale

| SC | Look for |
| --- | --- |
| 3.1.1 Language of Page | `lang` absent from the document, or hardcoded rather than following the active locale. |
| 3.1.2 Language of Parts | An inline phrase in another language with no `lang` on its wrapper. |

Text nodes come from `next-intl` per `docs/agents/coding-standards/i18n.md`. Report a hardcoded
string here.

### 11. Layout resilience

| SC | Look for |
| --- | --- |
| 1.3.4 Orientation | Layout or a route locked to one orientation, by CSS or by a redirect. |
| 1.4.4 Resize Text | A `px` font size, or a fixed `height`/`max-height` on a text container that clips when the text grows. Only the code smell is reportable; the rendered result is browser work. |
| 1.4.12 Text Spacing | Line height, letter spacing or word spacing set with `!important`, or text in a container that cannot grow. |

## Held elsewhere — a finding here means the gate is broken

| SC | Who holds it |
| --- | --- |
| 1.4.3 Contrast (Minimum) | Tokens — `src/styles/standard.css`, `dark-fantasy.css`, per `styling.md`. Values outside the tokens do not compile. The exception `accessibility.md` names is opacity: a dimmed state multiplies against the background, so report dimming below 70%, and any dimmed message. |
| 1.4.11 Non-text Contrast | Tokens, as above. |
| 2.4.7 Focus Visible | Tokens. Reportable only where a component removes the ring — `outline-none` with nothing replacing it. |
| 2.4.11 Focus Not Obscured | Browser. A sticky or fixed element can cover a focused control, and that is measured on rendered pixels. Reportable statically only when a new sticky element sits over a scrollable region of controls; otherwise raise it as a browser check. |
| 1.4.10 Reflow | Browser — horizontal scroll at 320px. Reportable statically only for a fixed `width` in `px` on a layout container. |
| 2.5.8 Target Size (Minimum) | Browser — 24×24 CSS pixels. Reportable statically when a control's size classes resolve below it and it is not inline text. |
| 1.4.5 Images of Text | Whether an asset is text is not visible in a diff. Reportable when a component renders an image where a string would do. |

Everything Biome's `a11y` recommended preset holds is section 4 of `SKILL.md` — never a finding.

## Not reachable — no such surface in this repo

`1.2.1`–`1.2.5` (captions, audio description, media alternatives), `1.4.2 Audio Control` and
`2.3.1 Three Flashes` need audio, video or flashing content. This repo renders none. If a diff adds
a `video`, `audio` or `canvas` animation, they come back into scope and this file needs the row.
