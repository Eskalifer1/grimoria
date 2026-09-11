import { Barlow, JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';

// Every face is preloaded: a preload cannot know the Theme, so the other
// Theme's files ride along once and sit in the cache after (#106). Weights are
// listed only where the family has no variable axis; Barlow has none (#54).
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  preload: true,
});

// No italic file: nothing sets it yet, and the browser slants the upright
// face on its own until a real italic is listed here.
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  preload: true,
});

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  preload: true,
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  preload: true,
});

/**
 * The two families `standard.css` reads. `global-error.tsx` and
 * `global-not-found.tsx` carry these alone: both render before a Theme is
 * resolved, so they draw on bare `:root`, which is `standard` (ADR-0015).
 */
const STANDARD_FONT_VARIABLES = [plusJakartaSans.variable, jetBrainsMono.variable].join(' ');

/**
 * Every font-family custom property the tokens read, as one class string for
 * `<html>`. The localized root layout carries it because either Theme may render
 * under it; which families each Theme actually reads is `src/styles/*.css`.
 */
const FONT_VARIABLES = [
  plusJakartaSans.variable,
  playfairDisplay.variable,
  barlow.variable,
  jetBrainsMono.variable,
].join(' ');

export { FONT_VARIABLES, STANDARD_FONT_VARIABLES };
