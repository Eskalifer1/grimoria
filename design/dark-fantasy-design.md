# Grimoria — `dark-fantasy` theme: visual design

The written description of how the `dark-fantasy` theme looks and behaves. It is the input
to building the design system, not its output — it names no tokens and fixes no values.
Concrete colour values, scales, and component tokens are what the design system produces
from this.

---

## 1. The product

**Grimoria** is a personal knowledge base. A user records things they learned — an
approach, a library, an article, a video — as searchable notes with an example and a source
link. Note content is Markdown. It is a working tool opened every day.

The product ships two themes. In `dark-fantasy`, the same product is reframed as a
wizard's grimoire: each note is a **spell** inscribed in it, the collection is the user's
**grimoire**, and the user is a **mage** who searches their grimoire to recall any spell
they have bound to memory.

The intended feeling: **magic and runes, something dark and mysterious, and at the same
time inviting.** Atmosphere may never cost legibility or the speed of scanning a list.

This document covers `dark-fantasy` only. A second theme, `standard` — a modern
developer-tool look — is specified separately.

---

## 2. Two material worlds

The interface is made of two materials, and this split is the design's central structural
idea. Every component has to be described for both; a control on one is never the other
recoloured.

**The Chrome** is dark and atmospheric. It holds the sidebar, the note list, modals, menus,
and notifications. Near-black neutral-warm greys, cool light, volumetric depth, things
emerging from haze.

**The Page** is light vellum — warm cream, aged, faintly fibrous. It holds the note body,
and nothing else. Dark ink on warm paper, the strongest text contrast anywhere in the
product.

The Page exists because long-form reading and writing must never be compromised by theme
decoration. That is a product requirement, not a stylistic preference. The Page is a
physical object lying above the dark field: it has weight, casts a soft shadow, and its
corner is cut rather than rounded.

---

## 3. Light and ink — the accent rule

Two accent colours, with strictly separated jobs.

**Red is ink.** A desaturated, slightly brick-toned blood red. It belongs to content and to
the Page: drop capitals opening a note, rubricated headings, tag outlines, callout and
warning borders, destructive actions. Ink is printed, absorbed, matte. **Red never glows.**

**Violet is light.** It belongs to the Chrome: active navigation, focus, halos, emitting
edges, the glow around interactive marks. Light is emitted, blooming, never flat. **Violet
never prints.**

Anything that seems to need both is two elements, not one.

The field beneath both is neutral and warm-leaning — a near-black grey rather than a
violet-black, so that the violet light reads as light falling on a neutral surface rather
than as a tinted background. Text on the Chrome is a warm off-white, closer to bone than
to paper.

---

## 4. Depth

Flatness is the failure mode this design exists to avoid. Depth comes from layering, light
behaviour, and texture — never from 3D, perspective, or isometric projection.

**Atmospheric imagery bleeds behind content and dissolves.** A dark scene sits behind the
masthead of a page and fades into the field with no hard edge. Panels sit *on* it,
semi-transparent, so the scene reads through them. This is the primary depth mechanism. It
belongs on mastheads and never anywhere it would compete with reading.

**Everything belongs to one of five receding planes**: the deepest field; the atmosphere
of haze, bloom, and imagery; the structure of frames and rules; the surfaces holding
content; and the light itself. No two adjacent planes share a brightness — each steps in
blur, opacity, and colour temperature.

**Light has a single origin on each screen**, and everything obeys it. Glows and gradients
fall away from it. Two elements of the same kind at different distances from it must not
look identical.

**Edges are lit, not stroked.** A border brightens on the side facing the light and fades
to nothing on the side facing away. A uniform thin grey rectangle around a panel is the
single largest cause of a flat interface.

**Surfaces are lit from within** — recessed, with inner shadow and a faint outer glow —
rather than floating on identical drop shadows. The Page is the deliberate exception: it
is a real object above the field and casts a genuine shadow.

**The Page emits.** Its warm light blooms onto the dark Chrome around it, tinting what is
nearby. A cream rectangle that does not spill light onto its surroundings reads as a
notebook page, not as an illuminated one.

**Fine grain lies over everything**, with a coarser paper tooth on vellum only. Nothing is
pure black or pure white; every extreme is tinted. The viewport carries a vignette, so the
screen has a centre.

---

## 5. Runes

Runes are the theme's signature motif. They are **carving that glows from within** — the
light sits in the groove and bleeds slightly onto the material around it — never a flat
printed shape.

They appear as the small unique sigil identifying each note, as section dividers, as the
empty-state mark, and as the loading indicator. Focus lights a rune rather than drawing an
outline ring around a control. Faint incised marginalia runs along the edges of the Chrome,
resolving only where light passes near it.

**Runes are never information.** Every label, action, title, and value is readable Latin
text. A rune may sit beside a label; it may never replace one. A user must never have to
decode the interface.

---

## 6. Typography

Four voices, from Google Fonts so they load through `next/font`. Two are this theme's own
and two are shared with `standard` — which two, and why, is in `token-contract.md`.

A **display serif** — high-contrast, classical, set in small capitals with wide tracking
where it labels rather than titles. It carries the wordmark, page and note titles, section
headings, and sidebar navigation.

An **interface sans** for everything functional: buttons, form labels, input text, meta
rows, tooltips, tables. The display serif never appears on these.

A **reading serif** for the note body on the Page, and nowhere else. It is the one face the
two themes share: `standard` sets its note body in this same serif, so that switching theme
never changes what long-form reading feels like. It is chosen for long sessions, with a
measure of roughly 68–75 characters and generous leading, and neither theme may override it
for decoration.

A **monospace** for code, inside a Note and out. Like the reading serif it is shared with
`standard`, and for the same reason: code is content the User wrote, and switching Theme must
not change how their own work reads.

Metadata — breadcrumbs, tags, dates, counts, section labels — is **not** monospace in this
theme. It is the interface sans, set small in capitals with wide tracking. This is the one
place the two themes voice the same role differently, and it is deliberate: a monospace
label would read as machinery in a theme built out of ink and light, where `standard` uses
it precisely because that technical note is what keeps it serious.

---

## 7. Surfaces and structure

Which shells exist, what the sidebar contains, and how it behaves at each width are not
settled here. That structure is identical in both themes and is documented in
`docs/features/site-layout.md`, which is canonical for it. What follows describes only how
those zones are made out of this theme's material. There is no global header: the sidebar is
the only chrome the app carries, and the vertical space a header would have taken belongs to
the list.

**The sidebar** carries the primary areas as icon-and-label rows in small-caps display
type, with the wordmark above and the user and log out below. The active row is marked by a
lit vertical edge and a faint warm wash, not by a solid fill — light is how this theme says
*here*. It is the plane nearest the viewer: slightly lighter than the field, with a lit
edge, and content passes beside it through haze rather than stopping at a rule.

Collapsed to an icon rail the rows lose their labels and keep their lit marking, because a
rail that cannot show which area is active is a dead strip of icons. As a drawer it is the
same Chrome brought forward, its edge lit harder against the dimmed field behind it. The
thin bar that opens the drawer carries the burger and the wordmark, and it is the
shallowest plane in the theme — it holds nothing else.

**The masthead** of a page carries the note count or status in monospace beneath a display
title, and closes with an ornamented rule rather than a plain hairline. It holds no
controls, and the space opposite the title stays empty as a reserved slot.

**Panels** in the Chrome are semi-transparent over the atmosphere behind them, bounded by
lit edges and, where the density warrants it, thin frames with corner brackets. Frames are
how a dense screen keeps depth without shadows.

**The list of notes** is uneven by construction: entries are not identical rectangles, they
vary by state, and the light falls across the list unevenly, brightest nearest its source.
What an entry is made of is settled with the design of the Notes list page, not here.

**The reading view** puts the Page at the centre. Above the body sit a breadcrumb and the
note's metadata; the body carries a dropped capital opening the first paragraph, section
headings, lists, quotations, inline and fenced code, links, and callouts. Ornamented rules
divide sections. Owner actions are present but subordinate to the text.

**Modals** are the theme's showpiece. The border is not an outline but **luminous growth**:
an organic filament creeping along the edge, thick in two or three places, dormant
elsewhere, and absent for whole runs, with short tendrils branching off and trailing into
the dark so the rectangle is broken. Bright buds sit at the branch points. The glow is
built from a wide dim halo, a medium glow, and a thin bright core — a single stroke never
reads as emission. The dimmed page behind takes a soft radial wash in the filament's
colour: the backdrop is a dark room lit by this object, not a flat scrim. The interior
stays calm, holding the strongest text contrast, with all the drama at the edge.

**Empty states** carry a line of themed copy and one rune mark. No illustration.

---

## 8. What this design is not

- Not a game interface. No skulls, dragons, swords, potions, shields, rarity stars, or
  power bars.
- Not flat: no identical cards in an even grid, evenly spaced and identically lit; no
  uniform radius on everything; no frosted-glass panel as the default surface.
- Not neon. No cyan or electric blue anywhere.
- Not decorated. Every ornament must emit light, catch it along the edge facing the source,
  or cast a shadow. An ornament doing none of the three is deleted.
- Not decorative at the cost of reading. Display type stays off small functional controls,
  and the note body stays in the reading serif under every circumstance.

---

## 9. Copy in mockups

The theme renames the product's concepts, and that renaming matters to the design: a
display serif set over the word *Notes* reads nothing like the same face set over
*Grimoire*. Screens must therefore be composed against flavoured copy, never against lorem
or the plain product vocabulary.

**Only four terms are settled**, and only these may be treated as fixed:

| Concept | Term |
|---|---|
| The product | Grimoria |
| A note | a spell |
| A user's notes, collectively | a grimoire |
| A user | a mage |

Everything else — what the public archive is called, what search is called, the wording of
buttons, placeholders, badges, empty states, and dates — **is not chosen yet.** Where a
mockup needs such a string, invent one in keeping with the four terms above and treat it as
disposable sample text. It is illustration, not a decision: nothing shown in a mockup
becomes product copy by virtue of having been rendered.

The copy mapping is owned by the copy system, which resolves every string through a
`locale × theme` catalog. It is a separate piece of work from this design and is settled
separately.

Beyond the flavour: compose against real technical subject matter. The design has to
survive a title like *Why Postgres row-level security beats app-side checks* and a note body
containing a fenced code block. Lists are shown at real density — a dozen or more entries,
never three placeholder cards.
