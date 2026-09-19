import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BrandData } from '../types';
const { callAI } = vi.hoisted(() => ({ callAI: vi.fn() }));
vi.mock('../aiGatekeeper', () => ({ callAI }));
vi.mock('../store', () => ({ useStore: { getState: () => ({ userId: 'alice', workspaceId: 'alice' }) } }));
import { GeminiService } from '../geminiService';
import { missionDate } from '../missionDates';

const brand = { name: 'Studio', industry: 'Fotografia', contentLanguage: 'PL', colors: [], pillars: [],
  platformDNA: {}, referenceImages: [], signature: { enabled: false } } as unknown as BrandData;
describe('Content creation', () => {
  beforeEach(() => { callAI.mockReset(); });
  it('keeps seven drafts without requiring seven image calls', async () => {
    callAI.mockResolvedValue(JSON.stringify(Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex, platform: 'instagram', topic: `Topic ${dayIndex}`, content: 'Treść', hook: 'Nagłówek', imageBrief: 'Photo', hashtags: []
    }))));
    const posts = await new GeminiService().generateWeeklyPlan(brand, 'PL');
    expect(posts).toHaveLength(7);
    expect(callAI).toHaveBeenCalledTimes(1);
    expect(posts.every(post => post.status === 'draft' && !!post.plannedDate)).toBe(true);
  });
  it('rejects malformed plans rather than saving unusable objects', async () => {
    callAI.mockResolvedValue(JSON.stringify({ content: 'wrong format' }));
    await expect(new GeminiService().generateWeeklyPlan(brand, 'PL')).rejects.toThrow('niepełny plan');
  });
  it('reports image failure instead of substituting a stock photo', async () => {
    callAI.mockRejectedValue(new Error('Provider quota exceeded'));
    await expect(new GeminiService().generateStudioImage('text-to-image', 'photo', 'instagram', brand, false)).rejects.toThrow('quota');
  });
  it('reports video failure instead of substituting a demo film', async () => {
    callAI.mockRejectedValue(new Error('Video unavailable'));
    await expect(new GeminiService().generateStudioVideo('text-to-video', 'film', 'tiktok', brand, false)).rejects.toThrow('Video unavailable');
  });
  it('maps week days correctly over a year boundary', () => {
    expect(missionDate(0, 0, new Date(2026, 0, 1))).toBe('2025-12-29');
    expect(missionDate(6, 0, new Date(2026, 0, 1))).toBe('2026-01-04');
  });
});
