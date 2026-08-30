import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * Reads `src/` as text, for the handful of rules that are about the shape of the
 * codebase rather than the behavior of one function — "this is the only caller of
 * `crypto.randomUUID`", "this module never reaches Payload".
 */
const SOURCE_ROOT = resolve(import.meta.dirname, '../../src');

/** Trees nobody writes by hand, so a match inside them says nothing about our code. */
const GENERATED = ['src/payload-types.ts', 'src/migrations', 'src/app/(payload)'];

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/** The path a rule is written in terms of — `src/api/user/userOptimisticKeys.ts`. */
function toRepoPath(absolutePath: string): string {
  return join('src', relative(SOURCE_ROOT, absolutePath));
}

function isGenerated(absolutePath: string): boolean {
  const repoPath = toRepoPath(absolutePath);

  return GENERATED.some((tree) => repoPath === tree || repoPath.startsWith(`${tree}/`));
}

/** Every hand-written `.ts`/`.tsx` under `src/`, as absolute paths. */
function listSourceFiles(directory: string = SOURCE_ROOT): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);

    if (isGenerated(absolutePath)) {
      continue;
    }

    if (statSync(absolutePath).isDirectory()) {
      found.push(...listSourceFiles(absolutePath));
      continue;
    }

    if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      found.push(absolutePath);
    }
  }

  return found;
}

function readSource(absolutePath: string): string {
  return readFileSync(absolutePath, 'utf8');
}

/** Matches `from '…'` and a bare `import '…'`, which is how `server-only` is pulled in. */
const IMPORT_PATTERN = /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g;

/** Every module specifier a file imports, packages included. */
function importSpecifiers(absolutePath: string): string[] {
  const specifiers: string[] = [];

  for (const match of readSource(absolutePath).matchAll(IMPORT_PATTERN)) {
    specifiers.push(match[1] ?? match[2] ?? '');
  }

  return specifiers;
}

/** Resolves a specifier to a file under `src/`, or `null` when it points at a package. */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  const base = specifier.startsWith('@/')
    ? join(SOURCE_ROOT, specifier.slice('@/'.length))
    : specifier.startsWith('.')
      ? resolve(dirname(fromFile), specifier)
      : null;

  if (base === null) {
    return null;
  }

  const candidates = [
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
    base,
  ];

  return (
    candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null
  );
}

/**
 * Every file an entry point reaches, transitively — the module graph a "never
 * imports Payload" rule has to look at, since one hop away is still a boot.
 */
function collectModuleGraph(entryPath: string): { files: string[]; packages: string[] } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entryPath];

  while (queue.length > 0) {
    const current = queue.pop() as string;

    if (files.has(current)) {
      continue;
    }

    files.add(current);

    for (const specifier of importSpecifiers(current)) {
      const resolved = resolveSpecifier(specifier, current);

      if (resolved === null) {
        packages.add(specifier);
        continue;
      }

      queue.push(resolved);
    }
  }

  return { files: [...files], packages: [...packages] };
}

export {
  collectModuleGraph,
  importSpecifiers,
  listSourceFiles,
  readSource,
  resolveSpecifier,
  SOURCE_ROOT,
  toRepoPath,
};
