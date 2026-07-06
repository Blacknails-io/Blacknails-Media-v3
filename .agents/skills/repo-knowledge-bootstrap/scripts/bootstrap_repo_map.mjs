#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ignoredDirs = new Set([
  ".git",
  ".agents",
  ".codex",
  ".codex-evaluator",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "data",
  "library",
  "outputs",
  "test-results",
  "playwright-report"
]);

const sourceExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".sql", ".yml", ".yaml"]);

export async function bootstrapRepoMap(repoRoot) {
  repoRoot = path.resolve(repoRoot);
  const outputDir = path.join(repoRoot, ".codex", "repo-map");
  const generatedAt = new Date().toISOString();

  const files = await walk(repoRoot);
  const packages = await readPackages(repoRoot, files);
  const scripts = collectScripts(packages);
  const frameworks = collectFrameworks(files, packages);
  const entrypoints = await collectEntrypoints(repoRoot, files, scripts);
  const domainSignals = await collectDomainSignals(repoRoot, files);
  const externalSurfaces = await collectExternalSurfaces(repoRoot, files, frameworks);
  const tests = collectTests(files, scripts);
  const risks = collectRisks(files, tests);

  await fs.mkdir(outputDir, { recursive: true });

  await write(outputDir, "index.md", `# Repo Map

Generated: ${generatedAt}

This is a technical orientation map generated from code and configuration. It does not confirm functional intent.

## Snapshot

- Files scanned: ${files.length}
- Package manifests: ${packages.length}
- Framework/tool signals: ${frameworks.length}
- Entrypoints: ${entrypoints.length}
- Domain signals: ${domainSignals.length}
- External surfaces: ${externalSurfaces.length}
- Test files: ${tests.files.length}
- Risks/unknowns: ${risks.length}

## Sections

- [Architecture](architecture.md)
- [Entrypoints](entrypoints.md)
- [Domain Model](domain-model.md)
- [External Surfaces](external-surfaces.md)
- [Tests](tests.md)
- [Risks And Unknowns](risks-and-unknowns.md)
`);

  await write(outputDir, "architecture.md", `# Architecture

## Observed Layer Directories

${list(collectLayerDirs(files))}

## Notes

- This section describes the structure found in the repo.
- It does not prescribe a target architecture.
- Mixed concerns should be treated as risks until reviewed by a human.
`);

  await write(outputDir, "entrypoints.md", `# Entrypoints

## Package Scripts

${table(scripts, ["manifest", "name", "command"])}

## Detected Entrypoints

${signals(entrypoints)}
`);

  await write(outputDir, "domain-model.md", `# Domain Model Signals

These are technical and domain-like signals found in code. They are not confirmed functional documentation.

${signals(domainSignals)}
`);

  await write(outputDir, "external-surfaces.md", `# External Surfaces

## Framework And Tool Signals

${signals(frameworks)}

## Services, Environment, And Side Effects

${signals(externalSurfaces)}
`);

  await write(outputDir, "tests.md", `# Tests And Quality

## Test And Quality Scripts

${table(tests.scripts, ["manifest", "name", "command"])}

## Test Files

${list(tests.files.map((file) => file.relative))}

## Gaps

- Coverage is not inferred from file presence.
- If a story touches behavior with no nearby test, add characterization tests before implementation.
`);

  await write(outputDir, "risks-and-unknowns.md", `# Risks And Unknowns

${signals(risks)}

## Human Validation Required

- Confirm business meaning before converting observed behavior into functional documentation.
- Confirm whether states, roles, workers, event names, and pipeline names are current intended concepts or historical drift.
`);

  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: "0.1.0",
        generatedAt,
        counts: {
          files: files.length,
          packages: packages.length,
          frameworks: frameworks.length,
          entrypoints: entrypoints.length,
          domainSignals: domainSignals.length,
          externalSurfaces: externalSurfaces.length,
          testFiles: tests.files.length,
          risks: risks.length
        }
      },
      null,
      2
    )}\n`
  );

  return { outputDir, generatedAt };
}

async function walk(root, current = root, out = []) {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) await walk(root, full, out);
    } else if (entry.isFile()) {
      out.push({
        absolute: full,
        relative: toPosix(path.relative(root, full)),
        ext: path.extname(entry.name)
      });
    }
  }
  return out;
}

async function readPackages(repoRoot, files) {
  const packages = [];
  for (const file of files.filter((item) => item.relative.endsWith("package.json"))) {
    try {
      packages.push({
        manifest: file.relative,
        json: JSON.parse(await fs.readFile(path.join(repoRoot, file.relative), "utf8"))
      });
    } catch {
      packages.push({ manifest: file.relative, json: {} });
    }
  }
  return packages;
}

function collectScripts(packages) {
  return packages.flatMap((pkg) =>
    Object.entries(pkg.json.scripts || {}).map(([name, command]) => ({
      manifest: pkg.manifest,
      name,
      command
    }))
  );
}

function collectFrameworks(files, packages) {
  const out = [];
  for (const pkg of packages) {
    const deps = { ...(pkg.json.dependencies || {}), ...(pkg.json.devDependencies || {}) };
    for (const [dep, label, type] of [
      ["typescript", "TypeScript", "language"],
      ["express", "Express", "http"],
      ["react", "React", "frontend"],
      ["vite", "Vite", "frontend-build"],
      ["@playwright/test", "Playwright", "test"],
      ["better-sqlite3", "SQLite via better-sqlite3", "database"],
      ["pg", "Postgres client", "database"],
      ["kafkajs", "KafkaJS", "event-bus"],
      ["multer", "Multer", "file-upload"],
      ["fluent-ffmpeg", "fluent-ffmpeg", "media-processing"],
      ["oxlint", "Oxlint", "lint"]
    ]) {
      if (deps[dep]) out.push(signal(label, type, "high", [pkg.manifest]));
    }
  }
  for (const file of files) {
    if (file.relative.endsWith("docker-compose.yml")) out.push(signal("Docker Compose", "runtime", "high", [file.relative]));
    if (file.relative.endsWith("Dockerfile")) out.push(signal("Dockerfile", "container", "high", [file.relative]));
  }
  return dedupe(out);
}

async function collectEntrypoints(repoRoot, files, scripts) {
  const out = scripts
    .filter((script) => /^(start|dev|serve|test|build|lint|test:e2e|worker|migrate)/.test(script.name))
    .map((script) => signal(`npm script ${script.name}`, "package-script", "high", [script.manifest, script.command]));

  for (const file of files) {
    const base = path.basename(file.relative);
    if (/^(index|main|server|app)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(base)) out.push(signal(file.relative, "boot-file", "medium", [file.relative]));
    if (base === "Dockerfile" || base === "docker-compose.yml") out.push(signal(file.relative, "container-entrypoint", "high", [file.relative]));
  }

  for (const file of sourceFiles(files)) {
    const text = await safeRead(path.join(repoRoot, file.relative));
    for (const match of text.matchAll(/\b(?:app|router)\.(get|post|put|patch|delete)\((['"`])([^'"`]+)\1/g)) {
      out.push(signal(`${match[0].split("(")[0].toUpperCase()} ${match[2]}`, "http-route", "high", [file.relative]));
    }
  }
  return dedupe(out);
}

async function collectDomainSignals(repoRoot, files) {
  const out = [];
  for (const file of sourceFiles(files)) {
    const text = await safeRead(path.join(repoRoot, file.relative));
    const base = path.basename(file.relative).replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
    if (/(Service|UseCase|Repository|Controller|Worker|Policy|Rule|Model|Entity|DTO|Event)$/.test(base)) out.push(signal(base, "model-or-coordination", "medium", [file.relative]));
    for (const match of text.matchAll(/\benum\s+([A-Za-z0-9_]+)/g)) out.push(signal(match[1], "state", "high", [file.relative]));
    for (const match of text.matchAll(/\btype\s+([A-Za-z0-9_]*(Status|State|Event|Worker)[A-Za-z0-9_]*)\s*=/g)) out.push(signal(match[1], "state", "high", [file.relative]));
    for (const match of text.matchAll(/\binterface\s+([A-Z][A-Za-z0-9_]+)/g)) out.push(signal(match[1], "model", "medium", [file.relative]));
    for (const match of text.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/gi)) out.push(signal(match[1], "database-table", "high", [file.relative]));
    for (const match of text.matchAll(/(['"`])([a-z0-9_-]+(?:worker|pipeline|asset|media|face|thumbnail|transcode|import|index|event)[a-z0-9_-]*)\1/gi)) out.push(signal(match[2], "state-or-name", "low", [file.relative]));
  }
  return dedupe(out).slice(0, 100);
}

async function collectExternalSurfaces(repoRoot, files, frameworks) {
  const out = frameworks.filter((item) => ["database", "event-bus", "media-processing", "file-upload"].includes(item.type));
  for (const file of files) {
    if (file.relative.endsWith(".env.example") || file.relative === ".env.example") {
      const text = await safeRead(path.join(repoRoot, file.relative));
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=/);
        if (match) out.push(signal(match[1], "environment-variable", "high", [file.relative]));
      }
    }
    if (file.relative.endsWith("docker-compose.yml")) {
      const text = await safeRead(path.join(repoRoot, file.relative));
      for (const match of text.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)) out.push(signal(match[1], "docker-service", "medium", [file.relative]));
    }
  }
  for (const file of sourceFiles(files)) {
    const text = await safeRead(path.join(repoRoot, file.relative));
    for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) out.push(signal(match[1], "environment-variable", "high", [file.relative]));
    if (/fetch\(|axios\.|http\.request|https\.request/.test(text)) out.push(signal("Outbound HTTP usage", "external-http", "medium", [file.relative]));
    if (/fs\.|readFile|writeFile|createReadStream|createWriteStream/.test(text)) out.push(signal("File-system access", "file-system", "medium", [file.relative]));
  }
  return dedupe(out).slice(0, 100);
}

function collectTests(files, scripts) {
  return {
    files: files.filter((file) => /(^|\/)(tests?|__tests__|e2e)(\/|$)|\.(test|spec)\./.test(file.relative)),
    scripts: scripts.filter((script) => /test|e2e|lint|build/.test(script.name))
  };
}

function collectRisks(files, tests) {
  const out = [];
  if (!files.some((file) => file.relative === "README.md" || file.relative.startsWith("docs/"))) out.push(signal("No documentation files found", "risk", "high", ["file scan"]));
  if (tests.files.length === 0) out.push(signal("No test files found", "risk", "high", ["file scan"]));
  for (const file of files) {
    if (/\.(ts|tsx|js|jsx)$/.test(file.ext) && /Service|Controller|Worker/.test(file.relative)) out.push(signal(`Review mixed concerns in ${path.basename(file.relative)}`, "risk", "low", [file.relative]));
  }
  return dedupe(out).slice(0, 80);
}

function collectLayerDirs(files) {
  const names = new Set(["domain", "application", "adapters", "controllers", "services", "repositories", "db", "workers", "http", "presentation", "components", "hooks", "shared"]);
  return [...new Set(files.map((file) => file.relative.split("/").slice(0, -1).join("/")).filter((dir) => dir.split("/").some((part) => names.has(part))))].sort();
}

function sourceFiles(files) {
  return files.filter((file) => sourceExts.has(file.ext));
}

function signal(name, type, confidence, evidence) {
  return { name, type, confidence, evidence };
}

function dedupe(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.name}:${item.type}`;
    const existing = map.get(key);
    if (existing) existing.evidence = [...new Set([...existing.evidence, ...item.evidence])].sort();
    else map.set(key, { ...item, evidence: [...new Set(item.evidence)].sort() });
  }
  return [...map.values()].sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`));
}

function signals(items) {
  if (!items.length) return "No entries found.";
  return items.map((item) => `- ${item.name}\n  Type: ${item.type}\n  Confidence: ${item.confidence}\n  Evidence:\n${item.evidence.map((entry) => `  - ${entry}`).join("\n")}`).join("\n\n");
}

function list(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "No entries found.";
}

function table(items, cols) {
  if (!items.length) return "No entries found.";
  return [`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`, ...items.map((item) => `| ${cols.map((col) => String(item[col] ?? "").replaceAll("|", "\\|")).join(" | ")} |`)].join("\n");
}

async function write(dir, file, content) {
  await fs.writeFile(path.join(dir, file), `${content.trimEnd()}\n`);
}

async function safeRead(file) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function cli() {
  const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  if (!isCli) return;
  const repoRoot = path.resolve(process.cwd(), process.argv[2] || ".");
  const result = await bootstrapRepoMap(repoRoot);
  console.log(`Generated repo map at ${path.relative(repoRoot, result.outputDir)}`);
}

cli().catch((error) => {
  console.error(error);
  process.exit(1);
});
