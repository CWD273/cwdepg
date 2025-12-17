// src/lib/parseM3u.ts
export interface PlaylistChannel {
  rawName: string;
  tvgId?: string;
  tvgName?: string;
  tvgCountry?: string;
  groupTitle?: string;
  url: string;
  attrs: Record<string, string>;
}

export function parseM3U(text: string): PlaylistChannel[] {
  const lines = text.split(/\r?\n/);
  const channels: PlaylistChannel[] = [];
  let lastExtinf: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#EXTINF')) {
      lastExtinf = trimmed;
    } else if (!trimmed.startsWith('#') && lastExtinf) {
      const info = parseExtinf(lastExtinf);
      channels.push({
        ...info,
        url: trimmed,
      });
      lastExtinf = null;
    }
  }
  return channels;
}

function parseExtinf(line: string) {
  // Example: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-country="US",Channel Name
  const idx = line.indexOf(':');
  const rest = idx >= 0 ? line.slice(idx + 1) : '';
  const [attrsPartRaw, namePartRaw] = rest.split(',');
  const attrsPart = attrsPartRaw ?? '';
  const namePart = namePartRaw ?? '';

  const attrs: Record<string, string> = {};
  const regex = /(\w[\w-]*?)="(.*?)"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(attrsPart)) !== null) {
    const key = match[1];
    const value = match[2];
    attrs[key] = value;
  }

  return {
    rawName: namePart.trim(),
    tvgId: attrs['tvg-id'],
    tvgName: attrs['tvg-name'],
    tvgCountry: attrs['tvg-country'],
    groupTitle: attrs['group-title'],
    attrs,
  };
                             }
