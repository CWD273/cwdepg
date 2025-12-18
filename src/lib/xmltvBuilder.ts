// src/lib/xmltvBuilder.ts
import type { MappedChannel } from './aiMatcher';
import type { Programme } from './epgAggregators';

function formatXmltvDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${year}${month}${day}${hour}${min}${sec} +0000`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildXmltv(channels: MappedChannel[], programmes: Programme[]): string {
  const uniqueChannelsMap = new Map<string, MappedChannel>();
  for (const ch of channels) {
    if (!uniqueChannelsMap.has(ch.internalId)) {
      uniqueChannelsMap.set(ch.internalId, ch);
    }
  }
  const uniqueChannels = Array.from(uniqueChannelsMap.values());

  const channelXml = uniqueChannels
    .map((ch) => {
      const displayNames = [
        ch.rawName,
        ch.tvgName,
        ch.canonicalName,
      ].filter(Boolean) as string[];

      const uniqueDisplayNames = Array.from(new Set(displayNames));

      const displayNameXml = uniqueDisplayNames
        .map((name) => `<display-name>${escapeXml(name)}</display-name>`)
        .join('');

      return `<channel id="${escapeXml(ch.internalId)}">${displayNameXml}</channel>`;
    })
    .join('');

  const programmeXml = programmes
    .map((p) => {
      const title = `<title lang="en">${escapeXml(p.title)}</title>`;
      const subTitle = p.subTitle
        ? `<sub-title lang="en">${escapeXml(p.subTitle)}</sub-title>`
        : '';
      const desc = p.desc ? `<desc lang="en">${escapeXml(p.desc)}</desc>` : '';
      const categories = (p.category ?? [])
        .map((c) => `<category lang="en">${escapeXml(c)}</category>`)
        .join('');
      const epNum = p.episodeNum
        ? `<episode-num system="xmltv_ns">${escapeXml(p.episodeNum)}</episode-num>`
        : '';

      return `<programme start="${formatXmltvDate(p.start)}" stop="${formatXmltvDate(
        p.stop
      )}" channel="${escapeXml(p.channelId)}">${title}${subTitle}${desc}${categories}${epNum}</programme>`;
    })
    .join('');

  const header = `<?xml version="1.0" encoding="UTF-8"?>`;
  const tvOpen = `<tv source-info-name="Custom EPG Aggregator" generator-info-name="Vercel XMLTV Service">`;
  const tvClose = `</tv>`;

  return `${header}${tvOpen}${channelXml}${programmeXml}${tvClose}`;
        }
