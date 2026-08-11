import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Two repairs to the installed `payload-auth`, applied on `postinstall` so an
 * upgrade or a fresh clone fixes itself. Both are idempotent, and both go away
 * the release upstream fixes them.
 *
 * 1. **It publishes bundler-only ESM.** Its relative imports carry no file
 *    extension, and it imports `next/headers`, which Next exposes as a file
 *    rather than through its `exports` map. Next resolves both; plain Node does
 *    not — so without this every Payload CLI command (`generate:types`,
 *    `generate:importmap`, `migrate`, `run`) dies on the config import.
 * 2. **Its database adapter logs a false alarm on every session read.** The
 *    `session` model points at `users` twice — `user` and the admin plugin's
 *    `impersonatedBy` — so the adapter calls the forward join ambiguous and
 *    prints to `console.error`, then picks `user`, which is the right one.
 *    There is no option to quiet it, and the noise buries real errors.
 */

const distRoot = path.resolve('node_modules/payload-auth/dist');

// `from "./x"` and `import("./x")`, relative specifiers only.
const relativeSpecifier = /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.[^"']*)\2/g;

const ambiguousJoinLog = /errorLog\(\[\s*`forward join field selection ambiguous[^`]*`\s*\]\);/g;

async function* jsFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* jsFiles(full);
    } else if (entry.name.endsWith('.js')) {
      yield full;
    }
  }
}

function patch(source, file) {
  return source
    .replace(relativeSpecifier, (match, head, quote, specifier) => {
      if (path.extname(specifier)) {
        return match;
      }

      const target = path.resolve(path.dirname(file), specifier);

      if (existsSync(`${target}.js`)) {
        return `${head}${quote}${specifier}.js${quote}`;
      }

      if (existsSync(path.join(target, 'index.js'))) {
        return `${head}${quote}${specifier}/index.js${quote}`;
      }

      return match;
    })
    .replaceAll('"next/headers"', '"next/headers.js"')
    .replace(ambiguousJoinLog, ';');
}

if (!existsSync(distRoot)) {
  console.log('payload-auth not installed, nothing to patch');
  process.exit(0);
}

let patched = 0;

for await (const file of jsFiles(distRoot)) {
  const source = readFileSync(file, 'utf8');
  const rewritten = patch(source, file);

  if (rewritten !== source) {
    writeFileSync(file, rewritten);
    patched += 1;
  }
}

console.log(`payload-auth: patched ${patched} file${patched === 1 ? '' : 's'}`);
