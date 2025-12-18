// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

import { parseM3U } from '../src/lib/parseM3u';
import { normalizeChannels } from '../src/lib/normalizeChannels';
import { matchChannelsWithAI } from '../src/lib/aiMatcher';
import { fetchEpgFromSources } from '../src/lib/epgAggregators';
import { buildXmltv } from '../src/lib/xmltvBuilder';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Always use your playlist
    const m3uUrl = 'https://cwdiptvb.github.io/tv_channels.m3u';

    // Default to 3 days of EPG (you can change this)
    const days = 3;

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
    const programmes = await fetchEpgFromSources(mappedChannels, { days });

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
