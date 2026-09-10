/**
 * One cookie out of a `document.cookie` string, decoded, or `null` when it is
 * not there. An empty value counts as absent: clearing a cookie is what leaves
 * one behind.
 *
 * @param source the raw `name=value; name=value` document, `document.cookie`
 */
function readCookie(source: string, name: string): string | null {
  for (const entry of source.split(';')) {
    const separator = entry.indexOf('=');

    if (separator === -1 || entry.slice(0, separator).trim() !== name) {
      continue;
    }

    return decodeURIComponent(entry.slice(separator + 1).trim()) || null;
  }

  return null;
}

export { readCookie };
