// src/lib/aiMatcher.ts
import type { NormalizedChannel } from './normalizeChannels';
import { cache } from './cache';

export interface MappedChannel extends NormalizedChannel {
  epgId?: string;
  epgCountry?: 'US' | 'CA';
  matchConfidence?: number;
}

interface AiMatchResult {
  epg_id: string | null;
  country: 'US' | 'CA' | 'UNKNOWN';
  confidence: number;
}

export async function matchChannelsWithAI(
  channels: NormalizedChannel[]
): Promise<MappedChannel[]> {
  const results: MappedChannel[] = [];

  for (const ch of channels) {
    const cacheKey = buildCacheKey(ch);
    const cached = cache.get<AiMatchResult>(cacheKey);
    let aiResult: AiMatchResult | null = cached ?? null;

    if (!aiResult) {
      aiResult = await callAiMatcher(ch);
      cache.set(cacheKey, aiResult, 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    if (!aiResult || !aiResult.epg_id || aiResult.confidence < 0.5) {
      results.push({ ...ch }); // no EPG mapping
    } else {
      results.push({
        ...ch,
        epgId: aiResult.epg_id,
        epgCountry: aiResult.country === 'UNKNOWN' ? ch.country : aiResult.country,
        matchConfidence: aiResult.confidence,
      });
    }
  }

  return results;
}

function buildCacheKey(ch: NormalizedChannel): string {
  return [
    ch.canonicalName.toLowerCase(),
    ch.tvgId ?? '',
    ch.tvgName ?? '',
    ch.tvgCountry ?? '',
  ].join('|');
}

// TODO: replace this with a real call to your chosen LLM
async function callAiMatcher(ch: NormalizedChannel): Promise<AiMatchResult> {
  // For now, a naive “identity” matcher; you’ll swap this for a real AI integration.
  // The structure is ready for you to plug in a model.
  const epgIdGuess = ch.tvgId || `${ch.brand}.${(ch.country || 'UNKNOWN').toLowerCase()}`;

  return {
    epg_id: epgIdGuess,
    country: ch.country,
    confidence: 0.6,
  };
}
