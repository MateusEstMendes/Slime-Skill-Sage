/**
 * Import Integrity Guard (Node packages)
 *
 * Keep this file identical in packages/game, packages/shared and apps/api.
 * It prevents future import errors that `tsc` or other unit tests may miss:
 *  1. Relative imports resolve to an existing file with EXACT casing (Linux CI is case-sensitive).
 *  2. Bare imports are declared in this package's package.json (no phantom deps via hoisting).
 *  3. Named VALUE imports from workspace packages (@slime-sage/*) exist as runtime exports.
 *  4. Every non-test module loads at runtime (catches circular-import TDZ crashes & broken paths).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(SRC_DIR, "..");
const REPO_ROOT = resolve(PKG_DIR, "../..");
const pkgJson = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8")) as {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];
const WORKSPACE_DIRS: Record<string, string> = {
  "@slime-sage/game": join(REPO_ROOT, "packages/game/src/index.ts"),
  "@slime-sage/shared": join(REPO_ROOT, "packages/shared/src/index.ts"),
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Exact-case existence check (works even on case-insensitive filesystems). */
function existsExactCase(absPath: string): boolean {
  const rel = relative(PKG_DIR, absPath);
  if (rel.startsWith("..")) {
    try {
      return statSync(absPath).isFile();
    } catch {
      return false;
    }
  }
  let current = PKG_DIR;
  for (const segment of rel.split(/[\\/]/)) {
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return false;
    }
    if (!entries.includes(segment)) return false;
    current = join(current, segment);
  }
  return statSync(current).isFile();
}

interface ParsedImport {
  file: string;
  specifier: string;
  typeOnly: boolean;
  namedValues: string[];
}

const IMPORT_RE =
  /(?:^|\n)\s*(import|export)\s+(type\s+)?([\s\S]*?)\s*from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g;

function parseImports(file: string, code: string): ParsedImport[] {
  const out: ParsedImport[] = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    if (m[5]) {
      out.push({ file, specifier: m[5], typeOnly: false, namedValues: [] });
      continue;
    }
    const typeOnly = Boolean(m[2]);
    const namedValues: string[] = [];
    const braces = (m[3] ?? "").match(/\{([\s\S]*)\}/);
    if (braces && !typeOnly) {
      for (const raw of braces[1].split(",")) {
        const part = raw.trim();
        if (!part || part.startsWith("type ")) continue;
        namedValues.push(part.split(/\s+as\s+/)[0].trim());
      }
    }
    out.push({ file, specifier: m[4], typeOnly, namedValues });
  }
  return out;
}

const packageNameOf = (spec: string) => {
  const parts = spec.split("/");
  return spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
};

const sourceFiles = walk(SRC_DIR).filter((f) => /\.(ts|tsx)$/.test(f));
const runtimeFiles = sourceFiles.filter((f) => !/\.test\.(ts|tsx)$/.test(f) && !/server\.ts$/.test(f));
const allImports = sourceFiles.flatMap((f) => parseImports(f, readFileSync(f, "utf8")));
const short = (f: string) => relative(REPO_ROOT, f);

describe(`Integridade de Importações (${pkgJson.name})`, () => {
  it("encontra arquivos-fonte para análise", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("todo import relativo aponta para um arquivo existente (com caixa exata)", () => {
    const broken: string[] = [];
    for (const imp of allImports) {
      if (!imp.specifier.startsWith(".")) continue;
      const target = resolve(dirname(imp.file), imp.specifier);
      if (!RESOLVE_SUFFIXES.some((s) => existsExactCase(target + s))) {
        broken.push(`${short(imp.file)} -> "${imp.specifier}"`);
      }
    }
    expect(broken, `Imports relativos quebrados:\n${broken.join("\n")}`).toEqual([]);
  });

  it("todo pacote importado está declarado no package.json", () => {
    const declared = new Set([
      ...Object.keys(pkgJson.dependencies ?? {}),
      ...Object.keys(pkgJson.devDependencies ?? {}),
    ]);
    const missing: string[] = [];
    for (const imp of allImports) {
      const spec = imp.specifier;
      if (spec.startsWith(".") || spec.startsWith("node:")) continue;
      const pkg = packageNameOf(spec);
      if (!declared.has(pkg)) missing.push(`${short(imp.file)} -> "${pkg}"`);
    }
    expect(missing, `Dependências não declaradas (fantasmas):\n${missing.join("\n")}`).toEqual([]);
  });

  it("todo import nomeado de valor dos pacotes do workspace existe em runtime", async () => {
    const missing: string[] = [];
    for (const imp of allImports) {
      const entry = WORKSPACE_DIRS[imp.specifier];
      if (!entry || imp.typeOnly || imp.namedValues.length === 0) continue;
      const mod = (await import(pathToFileURL(entry).href)) as Record<string, unknown>;
      for (const name of imp.namedValues) {
        if (!(name in mod)) missing.push(`${short(imp.file)} -> ${imp.specifier}#${name}`);
      }
    }
    expect(missing, `Exports inexistentes em runtime:\n${missing.join("\n")}`).toEqual([]);
  });

  it("todo módulo de runtime carrega sem erros", async () => {
    const failures: string[] = [];
    for (const file of runtimeFiles) {
      try {
        await import(pathToFileURL(file).href);
      } catch (err) {
        failures.push(`${short(file)}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    expect(failures, `Módulos que falharam ao carregar:\n${failures.join("\n")}`).toEqual([]);
  }, 60_000);
});
