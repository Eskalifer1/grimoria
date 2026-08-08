# `dark-fantasy` theme: visual design

How this Theme looks and behaves — the **input** to the design system, naming no tokens and
fixing no values. Values are `src/styles/dark-fantasy.css`, reasoning is
`dark-fantasy-tokens.md`. The sibling Theme is `standard-design.md`.

The product is a personal knowledge base (`CONTEXT.md`); this Theme reframes it as a wizard's
grimoire — a Note is a **spell**, the collection a **grimoire**, the User a **mage**. The
intended feeling: **magic and runes, dark and mysterious, and at the same time inviting.**
Atmosphere may never cost legibility or the speed of scanning a list.

## Two material worlds

The design's central structural idea. **Every component is described for both; a control on
one is never the other recolored.**

**The Chrome** is dark and atmospheric — sidebar, note list, modals, menus, notifications.
Near-black neutral-warm grays, cool light, volumetric depth, things emerging from haze.

**The Page** is light vellum — warm cream, aged, faintly fibrous — holding the note body and
nothing else. Dark ink on warm paper, the strongest text contrast in the product.

The Page exists because **long-form reading must never be compromised by theme decoration** — a
product requirement, not a preference. It is a physical object lying above the dark field: it
has weight, casts a soft shadow, and its corner is cut rather than rounded.

## Light and ink — the accent rule

Two accents with strictly separated jobs. Anything that seems to need both is two elements.

**Red is ink.** A desaturated, slightly brick-toned blood red belonging to content and the
Page: drop capitals opening a note, rubricated headings, tag outlines, callout and warning
borders, destructive actions. Printed, absorbed, matte. **Red never glows.**

**Violet is light.** It belongs to the Chrome: active navigation, focus, halos, emitting edges,
the glow around interactive marks. Emitted, blooming, never flat. **Violet never prints.**

The field beneath both is neutral and warm-leaning — near-black gray rather than violet-black,
so violet reads as light falling on a neutral surface rather than a tinted background. Text on
the Chrome is a warm off-white, closer to bone than paper.

## Depth

Flatness is the failure mode this design exists to avoid. Depth comes from layering, light
behavior and texture — never 3D, perspective, or isometric projection.

**Atmospheric imagery bleeds behind content and dissolves.** A dark scene sits behind a
masthead and fades into the field with no hard edge; panels sit _on_ it, semi-transparent, so
the scene reads through them. This is the primary depth mechanism, and it belongs on mastheads
— never where it would compete with reading.

**Five receding planes**: the deepest field; the atmosphere of haze, bloom and imagery; the
structure of frames and rules; the surfaces holding content; the light itself. **No two
adjacent planes share a brightness** — each steps in blur, opacity and color temperature.

**Light has a single origin per screen**, and everything obeys it. Two elements of the same
kind at different distances from it must not look identical.

**Edges are lit, not stroked.** A border brightens on the side facing the light and fades to
nothing on the side facing away. A uniform thin gray rectangle around a panel is the single
largest cause of a flat interface.

**Surfaces are lit from within** — recessed, inner shadow, faint outer glow — rather than
floating on identical drop shadows. The Page is the deliberate exception: a real object casting
a genuine shadow.

**The Page emits.** Its warm light blooms onto the dark Chrome around it. A cream rectangle
that does not spill light reads as a notebook page, not an illuminated one.

**Fine grain lies over everything**, with a coarser paper tooth on vellum only. Nothing is pure
black or white; every extreme is tinted. The viewport carries a vignette, so the screen has a
center.

## Runes

The signature motif: **carving that glows from within** — the light sits in the groove and
bleeds slightly onto the material around it — never a flat printed shape.

They appear as the per-note sigil, section dividers, the empty-state mark, and the loading
indicator. Focus lights a rune rather than drawing an outline ring. Faint incised marginalia
runs along the edges of the Chrome, resolving only where light passes near it.

**Runes are never information.** Every label, action, title and value is readable Latin text. A
rune may sit beside a label; it may never replace one.

## Typography

Four voices; two this theme's own, two shared. Families and weights are in
`dark-fantasy-tokens.md`.

A **display serif** — high-contrast, classical, set in small capitals with wide tracking where
it labels rather than titles — carries page and note titles, section headings, and sidebar
navigation. An **interface sans** carries everything functional: buttons, form labels, input
text, meta rows, tooltips, tables; the display serif never appears on these.

A **reading serif** sets the note body on the Page and nowhere else — the one face both themes
share, so switching theme never changes what long-form reading feels like; the constraint on it
is `token-contract.md`. A **monospace** carries code, shared for the same reason.

**Metadata is not monospace here** — breadcrumbs, tags, dates, counts and section labels are the
interface sans, small, in capitals, widely tracked. This is the one place the two themes voice
the same role differently, deliberately: a monospace label would read as machinery in a theme
built out of ink and light, where `standard` uses it precisely because that technical note
keeps it serious.

## Surfaces and structure

Structure is `docs/features/site-layout.md`; this is only how those zones are made of this
theme's material.

**The sidebar** carries the primary areas as icon-and-label rows in small-caps display type,
the brand mark above, user and log out below. The active row is marked by a lit vertical edge
and a faint warm wash, not a solid fill — light is how this theme says _here_. It is the plane
nearest the viewer: slightly lighter than the field, lit-edged, and content passes beside it
through haze rather than stopping at a rule.

Collapsed to an icon rail the rows lose labels and keep their lit marking, because a rail that
cannot show the active area is a dead strip of icons. As a drawer it is the same Chrome brought
forward, its edge lit harder against the dimmed field. The thin bar that opens it carries the
burger and the brand mark and is the shallowest plane in the theme.

**The masthead** carries the note count or status in monospace beneath a display title, closing
with an ornamented rule rather than a plain hairline.

**Panels** are semi-transparent over the atmosphere behind them, bounded by lit edges and,
where density warrants, thin frames with corner brackets. Frames are how a dense screen keeps
depth without shadows.

**The note list is uneven by construction**: entries are not identical rectangles, they vary by
state, and light falls across the list unevenly, brightest nearest its source.

**The reading view** puts the Page at the center, a breadcrumb and metadata above the body. The
body carries a dropped capital opening the first paragraph, section headings, lists,
quotations, inline and fenced code, links, and callouts, with ornamented rules dividing
sections. Owner actions are present but subordinate to the text.

**Modals are the showpiece.** The border is not an outline but **luminous growth**: an organic
filament creeping along the edge, thick in two or three places, dormant elsewhere and absent
for whole runs, with short tendrils branching off and trailing into the dark so the rectangle
is broken. Bright buds sit at the branch points. The glow is a wide dim halo, a medium glow and
a thin bright core — a single stroke never reads as emission. The dimmed page behind takes a
soft radial wash in the filament's color: a dark room lit by this object, not a flat scrim.
The interior stays calm and holds the strongest text contrast, with all the drama at the edge.

**Empty states** carry a line of themed copy and one rune mark. No illustration.

## What this design is not

- Not a game interface. No skulls, dragons, swords, potions, shields, rarity stars, power bars.
- Not flat: no identical cards in an even grid, evenly spaced and identically lit; no uniform
  radius on everything; no frosted-glass panel as the default surface.
- Not neon. No cyan or electric blue anywhere.
- Not decorated. Every ornament must emit light, catch it along the edge facing the source, or
  cast a shadow. An ornament doing none of the three is deleted.
- Not decorative at the cost of reading. Display type stays off small functional controls, and
  the note body stays in the reading serif under every circumstance.

## Copy in mockups

The renaming matters to the design: a display serif set over _Notes_ reads nothing like the
same face over _Grimoire_. Compose against flavored copy, never lorem or plain product
vocabulary.

**Only four terms are settled** and may be treated as fixed: **Grimoria**, a **spell**, a
**grimoire**, a **mage**. Everything else is not chosen yet — invent it in keeping with those
four and treat it as disposable sample text. Nothing shown in a mockup becomes product copy by
virtue of having been rendered, and mockup strings never enter the vocabulary table.

**Compose against real technical subject matter.** The design has to survive a title like _Why
Postgres row-level security beats app-side checks_ and a body with a fenced code block. Lists
show at real density — a dozen or more entries, never three placeholder cards.
