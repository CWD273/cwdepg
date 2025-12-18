// src/lib/channelBranding.ts

export const dualRegionBrands: string[] = [
  'cartoon network',
  'a&e',
  'a & e',
  'discovery channel',
  'history',
  'lifetime',
  'food network',
  'tlc',
  'hgtv'
];

export const canadianBrandPatterns: RegExp[] = [
  /\bcanada\b/i,
  /\bctv\b/i,
  /\bcitytv\b/i,
  /\bglobal\b/i,
  /\bcbc\b/i,
  /\bici radio-canada\b/i,
  /\bteletoon\b/i,
  /\byt v\b/i,
  /\bytv\b/i,
  /\btreehouse\b/i,
];

export function isExplicitCanadianName(name: string): boolean {
  const lower = name.toLowerCase();
  for (const pattern of canadianBrandPatterns) {
    if (pattern.test(lower)) return true;
  }
  return false;
}

export function isDualRegionBrand(name: string): boolean {
  const lower = name.toLowerCase();
  return dualRegionBrands.some((b) => lower.includes(b));
}
