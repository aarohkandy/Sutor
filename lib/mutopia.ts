import type { Instrument, MutopiaAsset } from "@/lib/types";

function buildAssetUrl(asset: MutopiaAsset): string {
  const params = new URLSearchParams({
    url: asset.url,
    kind: asset.kind,
    format: asset.format
  });

  return `/api/mutopia/asset?${params.toString()}`;
}

export async function fetchMutopiaAsset(asset: MutopiaAsset): Promise<ArrayBuffer> {
  const response = await fetch(buildAssetUrl(asset), {
    cache: "force-cache"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch Mutopia asset (${response.status})`);
  }

  return response.arrayBuffer();
}

export function instrumentLabel(instrument: Instrument): string {
  return instrument.charAt(0).toUpperCase() + instrument.slice(1);
}
