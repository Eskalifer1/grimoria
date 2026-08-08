# `dark-fantasy` theme: visual design

How this Theme looks and behaves. It is the **input** to the design system, not its output: it
names no tokens and fixes no values. Those are `dark-fantasy-tokens.md` and
`src/styles/dark-fantasy.css`. The sibling Theme is `standard-design.md`.

The product is a personal knowledge base (`CONTEXT.md`); this Theme reframes it as a wizard's
grimoire — a Note is a **spell**, the collection is a **grimoire**, the User is a **mage**.
The intended feeling: **magic and runes, dark and mysterious, and at the same time inviting.**
Atmosphere may never cost legibility or the speed of scanning a list.

## Two material worlds

The interface is made of two materials, and this split is the design's central structural
idea. **Every component is described for both; a control on one is never the other
recoloured.**

**The Chrome** is dark and atmospheric — sidebar, note list, modals, menus, notifications.
Near-black neutral-warm greys, cool light, volumetric depth, things emerging from haze.

**The Page** is light vellum — warm cream, aged, faintly fibrous. It holds the note body and
nothing else. Dark ink on warm paper, the strongest text contrast anywhere in the product.

The Page exists because **long-form reading and writing must never be compromised by theme
decoration**. That is a product requirement, not a stylistic preference. It is a physical
object lying above the dark field: it has weight, casts a soft shadow, and its corner is cut
rather than rounded.

## Light and ink — the accent rule

Two accents with strictly separated jobs. Anything that seems to need both is two elements,
not one.

**Red is ink.** A desaturated, slightly brick-toned blood red, belonging to content and to the
Page: drop capitals opening a note, rubricated headings, tag outlines, callout and warning
borders, destructive actions. Ink is printed, absorbed, matte. **Red never glows.**

**Violet is light.** It belongs to the Chrome: active navigation, focus, halos, emitting edges,
the glow around interactive marks. Light is emitted, blooming, never flat. **Violet never
prints.**

The field beneath both is neutral and warm-leaning — a near-black grey rather than a
violet-black, so violet light reads as light falling on a neutral surface rather than as a
tinted background. Text on the Chrome is a warm off-white, closer to bone than to paper.

## Depth

Flatness is the failure mode this design exists to avoid. Depth comes from layering, light
behaviour and texture — never from 3D, perspective, or isometric projection.

**Atmospheric imagery bleeds behind content and dissolves.** A dark scene sits behind a page's
masthead and fades into the field with no hard edge; panels sit _on_ it, semi-transparent, so
the scene reads through them. This is the primary depth mechanism. It belongs on mastheads and
never anywhere it would compete with reading.

**Everything belongs to one of five receding planes**: the deepest field; the atmosphere of
haze, bloom and imagery; the structure of frames and rules; the surfaces holding content; and
the light itself. **No two adjacent planes share a brightness** — each steps in blur, opacity
and colour temperature.

**Light has a single origin on each screen**, and everything obeys it. Glows and gradients fall
away from it; two elements of the same kind at different distances from it must not look
identical.

**Edges are lit, not stroked.** A border brightens on the side facing the light and fades to
nothing on the side facing away. A uniform thin grey rectangle around a panel is the single
largest cause of a flat interface.

**Surfaces are lit from within** — recessed, with inner shadow and a faint outer glow — rather
than floating on identical drop shadows. The Page is the deliberate exception: a real object
above the field, casting a genuine shadow.

**The Page emits.** Its warm light blooms onto the dark Chrome around it, tinting what is
nearby. A cream rectangle that does not spill light onto its surroundings reads as a notebook
page, not as an illuminated one.

**Fine grain lies over everything**, with a coarser paper tooth on vellum only. Nothing is pure
black or pure white; every extreme is tinted. The viewport carries a vignette, so the screen
has a centre.

## Runes

The theme's signature motif: **carving that glows from within** — the light sits in the groove
and bleeds slightly onto the material around it — never a flat printed shape.

They appear as the small unique sigil identifying each note, as section dividers, as the
empty-state mark, and as the loading indicator. Focus lights a rune rather than drawing an
outline ring around a control. Faint incised marginalia runs along the edges of the Chrome,
resolving only where light passes near it.

**Runes are never information.** Every label, action, title and value is readable Latin text. A
rune may sit beside a label; it may never replace one. A user must never have to decode the
interface.

## Typography

Four voices; two are this theme's own and two are shared with `standard`. Families and weights
are in `dark-fantasy-tokens.md`.

A **display serif** — high-contrast, classical, set in small capitals with wide tracking where
it labels rather than titles. It carries page and note titles, section headings, and sidebar
navigation.

An **interface sans** for everything functional: buttons, form labels, input text, meta rows,
tooltips, tables. The display serif never appears on these.

A **reading serif** for the note body on the Page and nowhere else — the one face both themes
share, so switching theme never changes what long-form reading feels like. Chosen for long
sessions, measure roughly 68–75 characters, generous leading. Neither theme may override it
for decoration.

A **monospace** for code, inside a Note and out. Shared with `standard` for the same reason:
code is content the User wrote.

**Metadata is not monospace in this theme** — breadcrumbs, tags, dates, counts and section
labels are the interface sans, set small in capitals with wide tracking. This is the one place
the two themes voice the same role differently, and it is deliberate: a monospace label would
read as machinery in a theme built out of ink and light, where `standard` uses it precisely
because that technical note keeps it serious.

## Surfaces and structure

Which shells exist, what the sidebar contains and how it behaves at each width are **not**
settled here — that structure is identical in both themes and `docs/features/site-layout.md`
is canonical for it. What follows is only how those zones are made of this theme's material.
There is no global header: the sidebar is the only chrome the app carries.

**The sidebar** carries the primary areas as icon-and-label rows in small-caps display type,
with the brand mark above and the user and log out below. The active row is marked by a lit
vertical edge and a faint warm wash, not a solid fill — light is how this theme says _here_. It
is the plane nearest the viewer: slightly lighter than the field, with a lit edge, and content
passes beside it through haze rather than stopping at a rule.

Collapsed to an icon rail the rows lose their labels and keep their lit marking, because a rail
that cannot show which area is active is a dead strip of icons. As a drawer it is the same
Chrome brought forward, its edge lit harder against the dimmed field behind it. The thin bar
that opens the drawer carries the burger and the brand mark, and is the shallowest plane in the
theme — it holds nothing else.

**The masthead** carries the note count or status in monospace beneath a display title, and
closes with an ornamented rule rather than a plain hairline. It holds no controls, and the
space opposite the title stays empty as a reserved slot.

**Panels** in the Chrome are semi-transparent over the atmosphere behind them, bounded by lit
edges and, where density warrants, thin frames with corner brackets. Frames are how a dense
screen keeps depth without shadows.

**The list of notes** is uneven by construction: entries are not identical rectangles, they
vary by state, and the light falls across the list unevenly, brightest nearest its source. What
an entry is made of is settled with the Notes list page design, not here.

**The reading view** puts the Page at the centre. Above the body sit a breadcrumb and the
note's metadata; the body carries a dropped capital opening the first paragraph, section
headings, lists, quotations, inline and fenced code, links, and callouts. Ornamented rules
divide sections. Owner actions are present but subordinate to the text.

**Modals are the theme's showpiece.** The border is not an outline but **luminous growth**: an
organic filament creeping along the edge, thick in two or three places, dormant elsewhere and
absent for whole runs, with short tendrils branching off and trailing into the dark so the
rectangle is broken. Bright buds sit at the branch points. The glow is built from a wide dim
halo, a medium glow and a thin bright core — a single stroke never reads as emission. The
dimmed page behind takes a soft radial wash in the filament's colour: the backdrop is a dark
room lit by this object, not a flat scrim. The interior stays calm, holding the strongest text
contrast, with all the drama at the edge.

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

The theme renames the product's concepts, and that renaming matters to the design: a display
serif set over the word _Notes_ reads nothing like the same face set over _Grimoire_. Compose
screens against flavoured copy, never against lorem or the plain product vocabulary.

**Only four terms are settled** and may be treated as fixed: **Grimoria** (the product), a
**spell** (a note), a **grimoire** (a user's notes), a **mage** (a user). Everything else — what
the public archive is called, what search is called, the wording of buttons, placeholders,
badges, empty states and dates — **is not chosen yet.** Invent one in keeping with those four
and treat it as disposable sample text: nothing shown in a mockup becomes product copy by
virtue of having been rendered, and mockup strings are never added to the vocabulary table.

Beyond the flavour, **compose against real technical subject matter**. The design has to
survive a title like _Why Postgres row-level security beats app-side checks_ and a note body
containing a fenced code block. Lists are shown at real density — a dozen or more entries,
never three placeholder cards.
