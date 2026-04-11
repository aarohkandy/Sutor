import { describe, expect, test } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { inferCatalogInstrument, isPublicDomainLicense, normalizeText, searchCatalog } from "@/lib/catalog";
import catalog from "@/data/catalog.json";

const execFileAsync = promisify(execFile);

describe("catalog helpers", () => {
  test("normalizes search text", () => {
    expect(normalizeText(" Air ('on the G string') ")).toBe("air on the g string");
  });

  test("detects public-domain licenses", () => {
    expect(isPublicDomainLicense("Public Domain")).toBe(true);
    expect(isPublicDomainLicense("Creative Commons Attribution 4.0")).toBe(false);
  });

  test("infers supported instruments", () => {
    expect(inferCatalogInstrument("Flute and Guitar")).toBe("flute");
    expect(inferCatalogInstrument("Viola")).toBe("viola");
    expect(inferCatalogInstrument("Voice")).toBeNull();
  });

  test("searches the baked catalog", () => {
    const results = searchCatalog(catalog as never[], "greensleeves");
    expect(results.some((piece) => piece.id === "violin-greensleeves")).toBe(true);
  });
});

describe("catalog builder script", () => {
  test("builds a public-domain-only catalog from fixture files", async () => {
    const fixtureRoot = path.join(process.cwd(), "tests", "fixtures", "catalog", "ftp");
    const scriptPath = path.join(process.cwd(), "scripts", "build-mutopia-catalog.mjs");
    const { stdout } = await execFileAsync("node", [scriptPath, "--source", fixtureRoot, "--stdout"], {
      cwd: process.cwd()
    });

    const entries = JSON.parse(stdout) as Array<{ title: string; instrument: string; publicDomain: boolean }>;
    expect(entries.some((entry) => entry.title === "Violin Etude" && entry.instrument === "violin")).toBe(true);
    expect(entries.some((entry) => entry.title === "Flute Study" && entry.instrument === "flute")).toBe(true);
    expect(entries.some((entry) => entry.title === "Not Public")).toBe(false);
  });
});
