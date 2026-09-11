/** What a `next/font` loader hands back — only `variable` is ever read here. */
interface LoadedFont {
  variable: string;
  className: string;
  style: { fontFamily: string };
}

/**
 * Stands in for a `next/font/google` loader, which only runs inside Next's own
 * bundler and throws under Vitest. Every family answers the same class: no test
 * asserts on which font a surface loaded, only that the variables are carried.
 */
function loadFont(): LoadedFont {
  return { variable: 'font-stub', className: 'font-stub', style: { fontFamily: 'stub' } };
}

export {
  loadFont as Barlow,
  loadFont as JetBrains_Mono,
  loadFont as Playfair_Display,
  loadFont as Plus_Jakarta_Sans,
};
