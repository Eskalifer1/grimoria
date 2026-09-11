# The mascot

What a pose SVG under `src/shared/assets/mascot/` promises, and how a new traced pose becomes one.
How a surface renders it is `docs/features/mascot.md`; the color values are the `--mascot-*` block
of `src/styles/standard.css` and `dark-fantasy.css`.

## Contents

- The character
- The asset contract
- Labeling a trace
- The next pose

## The character

One dragon, one spellbook. **The dragon says how it feels, the book says what happened**: `sad`
covers its mouth over a scorched corner, `lost` tilts its head over a dotted path that ends in a
question mark, `denied` holds up a paw before a chained padlock, `idle` has a quill before a blank
spread. `design/mascot/` keeps the two character sheets and one PNG per pose, the references for
the next pose.

**`dark-fantasy` is the drawing; `standard` is a recoloring of it** — same contour, the
reference sheet's palette, no flame.

## The asset contract

- **One file per pose, no color of its own.** Every painted element sits in a `<g class="…">`
  named for a body part or a prop, and `src/styles/mascot.css` fills it from the Theme's
  `--mascot-*` token of the same name.
- **The class list is the token list** — one set across all four files, never a set per file.
  A new pose reuses the classes; a new class is a token added to both Themes in one change
  (`design/token-contract.md`).
- **Prop classes carry the `prop-` prefix** and the same value in both Themes. Smoke and the
  question mark are scene content, not Theme detail: both Themes show them.
- **What only `dark-fantasy` shows sits in `class="detail"`** — today the tail flame and its
  rim — and `--mascot-detail` is `none` in `standard`. Nothing is put in `detail` that leaves a
  hole: the rim of the flame is the same contour as the tail's outline, so it is masked out of
  the silhouette and the book painted back in behind it.
- **The outline is recolored, never dropped**: black in `dark-fantasy`, the reference sheet's
  deep teal in `standard`.
- **The only literal colors are the mask's `#fff`/`#000`** — luminance, not paint.
- **At most 40 KB gzipped after svgo.** Coordinates are rounded to one decimal at labeling;
  svgo inside the loader takes the rest.

## Labeling a trace

The trace is a stack of flat fills: the first path is the whole silhouette in black, every later
path a quantized color painted over it. Labeling maps each hex to a class and splits the hexes
that serve two parts. The tools that did it for the first four poses are in commit `7c75013`
(ADR-0017); what follows is what they do.

1. **Strip the watermark.** A tracing service leaves a `<pattern>` and a corner `<text>`; delete
   both before anything else.
2. **Name every hex.** One tile per fill with its paths highlighted (`sheet.mjs`), then hex →
   class. A hex not named snaps to the nearest token color and is reported. A gradient is
   flattened to its first stop.
3. **Split the shared hexes by region.** The trace paints horns, ears, wings and the flame in one
   brown, and the eye glow and the spiral in one lilac. A region is a viewBox box plus the class
   it takes from and the class it gives; a subpath whose bounding-box center falls inside is
   moved. Read the boxes off the pose PNG (viewBox 2048 = the PNG's 1254 px × 1.633).
4. **Mask the flame out of the silhouette.** The first path is one contour, flame included, so it
   goes to `<defs>` and is drawn twice through luminance masks: the body minus the flame's box,
   and the box minus every skin subpath reaching into it dilated by the outline's width (34
   viewBox units), so the tail keeps its outline when the flame hides. Where the flame lies over
   the book, paint the book's bands back in behind it from a sampled pixel row (`denied`).
5. **Render it three ways** — one debug color per class with a legend, then each Theme — and
   look at the standard column for a part in the wrong color and at the tail for a sliver of
   rim left behind; adjust, rerun. Round coordinates to one decimal.
6. **Delete the trace** once the labeled file is right; the file under `src/` is the only SVG.

## The next pose

Generate with the character sheet and the previous pose's PNG as references: one dragon, one
book, the book's state carrying the event. Ask for flat fills and a black outline, then trace it
to SVG and label it as above. A pose is one key on `MASCOT_POSE` (`src/constants/mascot.ts`)
and its import in the map in `shared/components/Mascot/`.
