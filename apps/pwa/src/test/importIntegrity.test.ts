/**
 * Import Integrity Guard (PWA)
 *
 * Prevents future import errors that unit tests or `tsc` may miss:
 *  1. Every relative import points to a file that really exists, with EXACT casing
 *     (Codespaces/CI are Linux = case-sensitive; Windows/macOS are not).
 *  2. Every bare (package) import is declared in apps/pwa/package.json — no phantom
 *     dependencies that only work because of hoisting.
 *  3. Every named VALUE import from workspace packages (@slime-sage/game, @slime-sage/shared)
 *     exists as a runtime export (catches `export type` vs value mismatches under isolatedModules).
 *  4. Every non-test module can be loaded at runtime (catches broken paths, missing assets
 *     and circular-import TDZ crashes such as "Cannot access 'X' before initialization").
 */
import { describe, it, expect } from "vitest";
import * as gameExports from "@slime-sage/game";
import * as sharedExports from "@slime-sage/shared";
import pwaPackageJson from "../../package.json";

// Raw sources of all TS/TSX files (keys are real on-disk paths, relative to project root)
const sources = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Every file under src (only keys used: existence + exact casing)
const allFiles = new Set(Object.keys(import.meta.glob("/src/**/*")));

// Loaders for runtime modules (excluding tests, test setup and the app bootstrap entry)
const runtimeModules = import.meta.glob([
  "/src/**/*.{ts,tsx}",
  "!/src/**/*.test.{ts,tsx}",
  "!/src/test/**",
  "!/src/main.tsx",
]);

const WORKSPACE_EXPORTS: Record<string, Record<string, unknown>> = {
  "@slime-sage/game": gameExports,
  "@slime-sage/shared": sharedExports,
};

const RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];

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
    const clause = m[3] ?? "";
    const namedValues: string[] = [];
    const braces = clause.match(/\{([\s\S]*)\}/);
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

function dirname(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

function joinPath(base: string, rel: string): string {
  const parts = base.split("/");
  for (const seg of rel.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return parts.join("/");
}

function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

const allImports = Object.entries(sources).flatMap(([file, code]) => parseImports(file, code));

describe("Integridade de Importações (PWA)", () => {
  it("encontra os arquivos-fonte para análise", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(allImports.length).toBeGreaterThan(50);
  });

  it("todo import relativo aponta para um arquivo existente (com caixa exata)", () => {
    const broken: string[] = [];
    for (const imp of allImports) {
      if (!imp.specifier.startsWith(".")) continue;
      const cleanSpec = imp.specifier.split("?")[0];
      const target = joinPath(dirname(imp.file), cleanSpec);
      const found = RESOLVE_SUFFIXES.some((suffix) => allFiles.has(target + suffix));
      if (!found) broken.push(`${imp.file} -> "${imp.specifier}"`);
    }
    expect(broken, `Imports relativos quebrados:\n${broken.join("\n")}`).toEqual([]);
  });

  it("todo pacote importado está declarado no package.json da PWA", () => {
    const declared = new Set([
      ...Object.keys(pwaPackageJson.dependencies ?? {}),
      ...Object.keys(pwaPackageJson.devDependencies ?? {}),
    ]);
    const missing: string[] = [];
    for (const imp of allImports) {
      const spec = imp.specifier;
      if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("node:")) continue;
      if (spec.startsWith("virtual:")) continue;
      const pkg = packageNameOf(spec);
      if (!declared.has(pkg)) missing.push(`${imp.file} -> "${pkg}"`);
    }
    expect(missing, `Dependências não declaradas (fantasmas):\n${missing.join("\n")}`).toEqual([]);
  });

  it("todo import nomeado de valor dos pacotes do workspace existe em runtime", () => {
    const missing: string[] = [];
    for (const imp of allImports) {
      const exportsMap = WORKSPACE_EXPORTS[imp.specifier];
      if (!exportsMap || imp.typeOnly) continue;
      for (const name of imp.namedValues) {
        if (!(name in exportsMap)) missing.push(`${imp.file} -> ${imp.specifier}#${name}`);
      }
    }
    expect(
      missing,
      `Exports inexistentes em runtime (talvez seja tipo e precise de "type"):\n${missing.join("\n")}`
    ).toEqual([]);
  });

  it(
    "todo módulo de runtime carrega sem erros (sem ciclos com TDZ, caminhos ou assets quebrados)",
    async () => {
      const failures: string[] = [];
      for (const [path, load] of Object.entries(runtimeModules)) {
        try {
          await load();
        } catch (err) {
          failures.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      expect(Object.keys(runtimeModules).length).toBeGreaterThan(10);
      expect(failures, `Módulos que falharam ao carregar:\n${failures.join("\n")}`).toEqual([]);
    },
    60_000
  );
});
