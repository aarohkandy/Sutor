import { promises as fs } from "node:fs";
import path from "node:path";

function normalizeText(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPublicDomainLicense(value) {
  return normalizeText(value).includes("public domain");
}

function inferInstrument(instrumentLine) {
  const normalized = normalizeText(instrumentLine);
  if (normalized.includes("viola")) return "viola";
  if (normalized.includes("flute")) return "flute";
  if (normalized.includes("violin")) return "violin";
  return null;
}

function parseHeaderFields(source) {
  const headerMatch = source.match(/\\header\s*\{([\s\S]*?)\n\}/);
  if (!headerMatch) {
    return null;
  }

  const body = headerMatch[1];
  const fields = {};
  for (const match of body.matchAll(/([a-zA-Z]+)\s*=\s*"([^"]*)"/g)) {
    fields[match[1].toLowerCase()] = match[2];
  }
  return fields;
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ly")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function buildCatalog(sourceRoot) {
  const files = await walk(sourceRoot);
  const results = [];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const fields = parseHeaderFields(text);
    if (!fields) {
      continue;
    }

    const instrumentLine = fields.mutopiainstrument || fields.instrument || "";
    const instrument = inferInstrument(instrumentLine);
    if (!instrument) {
      continue;
    }

    const license = fields.license || fields.copyright || "";
    results.push({
      relativePath: path.relative(sourceRoot, file).replace(/\\/g, "/"),
      title: fields.mutopiatitle || fields.title || "",
      composer: fields.composer || fields.mutopiacomposer || "",
      mutopiaComposer: fields.mutopiacomposer || "",
      instrumentLine,
      style: fields.style || "",
      source: fields.source || "",
      license,
      publicDomain: isPublicDomainLicense(license),
      instrument
    });
  }

  return results
    .filter((entry) => entry.publicDomain)
    .sort((left, right) => `${left.instrument}:${left.composer}:${left.title}`.localeCompare(`${right.instrument}:${right.composer}:${right.title}`));
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf("--source");
  const outIndex = args.indexOf("--out");
  const stdout = args.includes("--stdout");
  const sourceRoot = sourceIndex >= 0 ? args[sourceIndex + 1] : path.join(process.cwd(), ".mutopia-source", "ftp");
  const outputPath = outIndex >= 0 ? args[outIndex + 1] : path.join(process.cwd(), "data", "generated-mutopia-catalog.json");

  const catalog = await buildCatalog(sourceRoot);
  const json = JSON.stringify(catalog, null, 2);

  if (stdout) {
    process.stdout.write(json);
    return;
  }

  await fs.writeFile(outputPath, json);
  process.stdout.write(`Wrote ${catalog.length} entries to ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
