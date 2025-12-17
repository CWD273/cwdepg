// api/epg.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

import { parseM3U } from '../src/lib/parseM3u';
import { normalizeChannels } from '../src/lib/normalizeChannels';
import { matchChannelsWithAI } from '../src/lib/aiMatcher';
import { fetchEpgFromSources } from '../src/lib/epgAggregators';
import { buildXmltv } from '../src/lib/xmltvBuilder';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const m3uUrl =
      (req.query.m3u as string | undefined) ??
      'https://cwdiptvb.github.io/tv_channels.m3u'; // adjust if different

    const days = parseInt((req.query.days as string) ?? '3', 10);
    const safeDays = Number.isNaN(days) ? 3 : Math.min(Math.max(days, 1), 14);

    // 1. Fetch and parse M3U
    const m3uRes = await fetch(m3uUrl);
    if (!m3uRes.ok) {
      res.status(502).send(`Failed to fetch M3U from ${m3uUrl}`);
      return;
    }
    const m3uText = await m3uRes.text();
    const playlistChannels = parseM3U(m3uText);

    // 2. Normalize channels (canonical name, brand, US/CA rules)
    const normalizedChannels = normalizeChannels(playlistChannels);

    // 3. AI-based mapping to EPG IDs (with caching)
    const mappedChannels = await matchChannelsWithAI(normalizedChannels);

    // 4. Fetch EPG data from configured EPG sources
    const programmes = await fetchEpgFromSources(mappedChannels, { days: safeDays });

    // 5. Build XMLTV
    const xml = buildXmltv(mappedChannels, programmes);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 min
    res.status(200).send(xml);
  } catch (err) {
    console.error('EPG error:', err);
    res.status(500).send('Internal server error');
  }
}
