# `standard` theme: visual design

How this Theme looks and behaves — the **input** to the design system, naming no tokens and
fixing no values. Values are `src/styles/standard.css`, reasoning is `standard-tokens.md`. The
sibling Theme is `dark-fantasy-design.md`.

`standard` is the product's default and unflavoured face: no wizard framing, no spells. A note
is a note, and everything the interface says is said plainly. It is a single light theme —
there is no dark sub-variant of `standard` and no light sub-variant of `dark-fantasy`, because
`Theme` is one axis with two values and each value is one complete look.

**On the stated direction.** The design epic places `standard` in the Linear / Raycast /
Vercel-Dashboard family. What is settled here is a different register: warmer, rounder,
friendlier, closer to a modern productivity product. It keeps the three properties that
mattered — one strong accent colour, monospace for metadata and tags, generous negative space —
and changes the reference family. **The epic gets corrected rather than this document bent back
to it.**

## One material, many depths

Where `dark-fantasy` is built from two opposed materials, `standard` is built from one: white
paper, layered. The field is a very light near-white with the faintest cool tint, carrying
broad, extremely soft washes of pale colour that never resolve into shapes. Surfaces are white
panels floating on it. The whole design lives in the narrow band between white and near-white,
and its craft is making that band read as depth rather than fog.

Because there is one material, **the note body needs no separate surface**: the reading surface
is the same white as everything else, and long-form reading is protected by the reading face,
measure, leading and contrast rather than by a change of material. This is the structural
difference between the themes, and why a component specified once here is specified twice in
`dark-fantasy`.

## Colour

**Two accents with different jobs.** The primary is a deep saturated teal, dark enough to hold
white text, carrying the brand mark, the primary button, the active navigation row and the
current sub-item. Used sparingly, it always means _this is the thing you act on or are looking
at_.

The secondary is a violet, and **it never carries an action** — that restriction is the whole
point of having it. It belongs to content rather than chrome, tinting code surfaces and marking
emphasis inside what the user wrote. The two are close enough in temperature to read as one
palette and far enough apart that _teal acts, violet is content_ holds without anyone being
told.

**A family of pale tints** for categorisation — soft mint, pale cyan, pale lavender, light
neutral grey — drawn off the two accents plus one neutral, filling tag chips and code blocks.
Close enough in value to read as one system, light enough that dark text sits on them
comfortably. Category colour is a label, never decoration.

**A bright cyan for live status only**: a selected edge, an unread marker. The one colour
permitted to feel electric, appearing in small amounts.

**Text** is a near-black with a slight purple cast rather than pure black — the same warmth that
keeps a title from reading cold beside the teal. Secondary text is mid grey; metadata is
lighter still and set in the monospace face.

Nothing here is grey-on-grey: every panel is white, every division is a hairline or a shadow,
and colour appears only where it carries meaning.

## Depth in a light interface

A light UI goes flat more easily than a dark one, because it cannot use glow. Depth comes from
four things, in this order:

**Soft, large, low-opacity shadows** — wide and diffuse rather than tight and dark, so panels
feel lifted rather than outlined. Different elevations get genuinely different shadows: a card,
a popover and a modal must not share one.

**White on near-white.** The field is never pure white, so white panels read as brighter than
their surroundings. This single relationship does most of the work.

**Pale gradient washes in the field**, very large and very low in saturation, so regions sit at
slightly different temperatures. They must never resolve into a visible shape or edge.

**Hairlines, used sparingly** — separating a header from content, or metadata from a card's
body. Not how panels are bounded: a thin grey rectangle around every card is the flatness
failure mode here, exactly as in the dark theme.

Corner radii are generous and consistent, and the softness is the point: this theme is round
where `dark-fantasy` is cut.

## Typography

Three voices, two faces. Families and weights are in `standard-tokens.md`.

A **geometric sans** carries both display and interface, separated by weight and size rather
than a second family. Heavy and large it is display — page titles, card titles, the active
navigation label — and its roundness there is a large part of the theme's character; at reading
weight the same family sets body copy, form labels and buttons, where it is meant to be
unremarkable. One family doing both keeps the interface from sounding like two products
stapled together.

A **monospace** for all metadata: dates, counts, tags, sidebar section labels. This is the
theme's one deliberately technical note, and what keeps a soft, rounded design from reading as
unserious. Usually uppercase and letterspaced when it labels a region, plain when it states a
fact.

A **reading serif** for the note body and nowhere else — the one face `standard` does not own,
since `dark-fantasy` sets the note body in the same serif so switching theme never changes what
long-form reading feels like. Generous leading; the constraint on it is
`token-contract.md`.

**Display weights never appear on small functional controls.**

## Structure and surfaces

Structure is `docs/features/site-layout.md`; this is only how those zones are made of this
theme's material.

**The sidebar** holds the brand mark at the head, navigation as icon-and-label rows under
monospace section labels, and user and log out at the foot. Rows owning sub-items expand into
an indented set joined by a hairline spine. The active row is a filled pale-tint rounded panel
with an accent icon and label; a current sub-item is marked by accent text alone. Its surface
is white like the panels, separated from the field by being brighter rather than by a border.

The collapse control sits on its edge, half overhanging. Collapsed, labels go and icons hold
their centres, so nothing slides sideways when it reopens. As a drawer it is the same surface
at a higher elevation, carrying its own shadow over a scrim; the thin bar that opens it holds
the burger and the brand mark and nothing else — chrome rather than a masthead, and it must not
grow controls.

**The masthead** carries a large display title with a monospace count or status line beneath,
closed by a hairline.

**The note list is a masonry grid**, not a uniform one — cards take the height their content
needs and columns fill independently, because an even grid of equal cards is what makes a notes
app look like a template.

**Empty states** carry one plain line explaining what to do, and one action.

The reference images beside this document are working files — read them for material and
atmosphere only. What in them is not canonical for structure is
`docs/features/site-layout.md`.

## What this design is not

- Not flavoured. No wizard, spell, grimoire, scribe or archive vocabulary — that belongs to the
  other theme. Interface text here is plain and direct.
- Not a uniform grid of equal cards.
- Not bounded by borders. Panels are defined by shadow and by being brighter than the field.
- Not grey. Backgrounds are white or near-white; mid-greys are for text, not surfaces.
- Not pastel everywhere. The tint family is for categorisation and small fills; large areas stay
  white.
- Not decorative at the cost of density. This is a tool for scanning many notes quickly, and
  whitespace serves scanning rather than spectacle.

## Copy in mockups

Interface copy is **not chosen yet**. Write mockup strings plainly and treat them as disposable
sample text. Two constraints apply while composing, because they are about the design rather
than the words:

- **Plain vocabulary only.** A count says what it counts; a navigation row says where it goes.
  Flavoured phrasing reads as a mistake here — a note is a note, never an inscription.
- **Real subject matter, real density.** Compose against genuine technical notes — a title like
  _Why Postgres row-level security beats app-side checks_, a body with a fenced code block — and
  show a dozen or more cards. Three placeholder cards prove nothing about a masonry layout.

Sidebar navigation in any mockup must reflect this product's actual areas. Invoices, wallets,
tasks, messaging and user levels belong to dashboard templates, not to Grimoria.
