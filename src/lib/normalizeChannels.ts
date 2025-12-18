// src/lib/normalizeChannels.ts
import type { PlaylistChannel } from './parseM3u';
import { isExplicitCanadianName, isDualRegionBrand } from './channelBranding';

export interface NormalizedChannel extends PlaylistChannel {
  canonicalName: string;
  brand: string;
  country: 'US' | 'CA' | 'UNKNOWN';
  internalId: string; // XMLTV <channel id>
}

export function normalizeChannels(channels: PlaylistChannel[]): NormalizedChannel[] {
  return channels.map((ch, index) => {
    const canonicalName = cleanName(ch.rawName || ch.tvgName || '');
    const brand = deriveBrand(canonicalName);
    const country = deriveCountry(ch, canonicalName, brand);
    const internalId = buildInternalId({ canonicalName, brand, country, index });

    return {
      ...ch,
      canonicalName,
      brand,
      country,
      internalId,
    };
  });
}

function cleanName(name: string): string {
  return name
    .replace(/\s+\(HD\)|\s+HD|\s+FHD|\s+UHD|\s+4K/gi, '')
    .replace(/

\[.*?\]

/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveBrand(canonicalName: string): string {
  return canonicalName.toLowerCase();
}

function deriveCountry(
  ch: PlaylistChannel,
  canonicalName: string,
  brand: string
): 'US' | 'CA' | 'UNKNOWN' {
  const fromAttr = ch.tvgCountry?.toUpperCase();
  if (fromAttr === 'US' || fromAttr === 'CA') return fromAttr;

  if (isExplicitCanadianName(canonicalName)) return 'CA';

  if (isDualRegionBrand(canonicalName)) {
    // Your rule: default to US unless explicitly Canadian
    if (canonicalName.toLowerCase().includes('canada')) return 'CA';
    return 'US';
  }

  return 'UNKNOWN';
}

function buildInternalId(opts: {
  canonicalName: string;
  brand: string;
  country: string;
  index: number;
}): string {
  const slug = opts.brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  const suffix = opts.country !== 'UNKNOWN' ? `.${opts.country.toLowerCase()}` : '';
  return slug ? `${slug}${suffix}` : `chan-${opts.index}`;
}
