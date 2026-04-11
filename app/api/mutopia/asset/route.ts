import { unzipSync } from "fflate";
import { NextRequest, NextResponse } from "next/server";

function pickEntry(entries: Record<string, Uint8Array>, extension: ".mid" | ".pdf"): Uint8Array | null {
  const keys = Object.keys(entries)
    .filter((key) => key.toLowerCase().endsWith(extension))
    .sort((left, right) => left.length - right.length);
  return keys.length > 0 ? entries[keys[0]] : null;
}

function contentType(format: string): string {
  return format === "midi" ? "audio/midi" : "application/pdf";
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const url = search.get("url");
  const kind = search.get("kind");
  const format = search.get("format");

  if (!url || !kind || !format) {
    return NextResponse.json({ error: "Missing asset parameters." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid asset URL." }, { status: 400 });
  }

  if (parsed.hostname !== "www.mutopiaproject.org") {
    return NextResponse.json({ error: "Only Mutopia assets are allowed." }, { status: 400 });
  }

  const response = await fetch(parsed.toString(), {
    cache: "force-cache"
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to fetch Mutopia asset." }, { status: response.status });
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (kind === "zip") {
    const entries = unzipSync(buffer);
    const entry = pickEntry(entries, format === "midi" ? ".mid" : ".pdf");
    if (!entry) {
      return NextResponse.json({ error: "No matching file found inside archive." }, { status: 422 });
    }

    return new NextResponse(Buffer.from(entry), {
      headers: {
        "Content-Type": contentType(format),
        "Cache-Control": "public, max-age=86400, s-maxage=86400"
      }
    });
  }

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": contentType(format),
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }
  });
}
