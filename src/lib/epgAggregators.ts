// src/lib/epgAggregators.ts
import fetch from 'node-fetch';
import type { MappedChannel } from './aiMatcher';
import { parseStringPromise } from 'xml2js'; // If you choose to add xml2js

export interface Programme {
  channelId: string;
  start: Date;
  stop: Date;
  title: string;
  subTitle?: string;
  desc?: string;
  category?: string[];
  episodeNum?: string;
}

// If you don't want xml2js, you can assume your EPG source returns JSON.
// Here I'll sketch a JSON-based API for simplicity.

interface RawProgramme {
  start: string; // ISO string or epoch
  stop: string;
  title: string;
  subTitle?: string;
  desc?: string;
  category?: string[];
  episodeNum?: string;
}

/**
 * Fetch and merge EPG data from your preferred sources.
 * Right now, this uses a placeholder JSON API endpoint.
 */
export async function fetchEpgFromSources(
  channels: MappedChannel[],
  opts: { days: number }
): Promise<Programme[]> {
  const epgPrograms: Programme[] = [];

  const channelsWithEpg = channels.filter((c) => c.epgId);

  // Simple sequential loop; you can parallelize if your EPG endpoint allows it.
  for (const ch of channelsWithEpg) {
    const raw = await fetchFromPlaceholderSource(ch.epgId!, opts.days);
    for (const r of raw) {
      epgPrograms.push({
        channelId: ch.internalId,
        start: new Date(r.start),
        stop: new Date(r.stop),
        title: r.title,
        subTitle: r.subTitle,
        desc: r.desc,
        category: r.category ?? [],
        episodeNum: r.episodeNum,
      });
    }
  }

  // TODO: if you have multiple sources, merge by channel/start time/title similarity.
  return epgPrograms;
}

// Replace this with your real EPG source.
async function fetchFromPlaceholderSource(epgId: string, days: number): Promise<RawProgramme[]> {
  // Example placeholder: no real data
  // You would call something like:
  // const url = `https://your-epg-provider.example/api?channel=${encodeURIComponent(epgId)}&days=${days}`;
  // const res = await fetch(url); const data = await res.json();
  // return data.programs as RawProgramme[];

  // For now, return empty to keep the service functional (just no programmes).
  return [];
}
