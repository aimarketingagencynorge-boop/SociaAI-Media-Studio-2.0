import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Workshop from '../components/Workshop';
import { graphicSvg, workshopPost } from '../workshop';
import { starterBalance, STARTER_CREDITS } from '../launchOffer';
import { createGenerationLimiter } from '../serverRateLimit';
import { EventEmitter } from 'node:events';

describe('Independent workshop and starter offer', () => {
  it('does not grant credits at registration or refill a spent or legacy wallet', () => {
    expect(starterBalance()).toBe(0);
    expect(starterBalance({ creditBalance: 0, starterCreditsGranted: true })).toBe(0);
    expect(starterBalance({ creditBalance: 12 })).toBe(12);
    expect(starterBalance({})).toBe(0);
  });
  it('escapes user-provided content in exported SVG and preserves portrait dimensions', () => {
    const svg = graphicSvg('<script>alert(1)</script>', 'A & B', 'red" onload="bad()', true);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('onload=');
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('height="1350"');
  });
  it('keeps templates honest about missing facts', () => {
    expect(workshopPost({ name: 'Studio', offer: 'Zdjęcia', audience: 'Twórcy' }, 2)).toContain('[Opisz prawdziwy etap');
  });
  it('edits and keeps separate mission drafts without a login or network call', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<Workshop onClose={vi.fn()} onStart={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText('Treść posta'), { target: { value: 'Mój własny post' } });
    fireEvent.click(screen.getByRole('button', { name: '2. Jedna wskazówka' }));
    expect(screen.getByLabelText('Treść posta')).not.toHaveValue('Mój własny post');
    fireEvent.click(screen.getByRole('button', { name: '1. Poznajmy się' }));
    expect(screen.getByLabelText('Treść posta')).toHaveValue('Mój własny post');
    expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
  });
  it('limits concurrent AI calls independently per account and releases a slot once', () => {
    const limiter = createGenerationLimiter(() => 1000);
    const call = (uid: string) => { const res: any = new EventEmitter(); res.setHeader = vi.fn(); res.status = vi.fn().mockReturnThis(); res.json = vi.fn(); const next = vi.fn(); limiter({ body: { userId: uid } } as any, res, next); return { res, next }; };
    const first = call('alice'); call('alice');
    expect(call('alice').res.status).toHaveBeenCalledWith(429);
    expect(call('bob').next).toHaveBeenCalled();
    first.res.emit('finish'); first.res.emit('close');
    expect(call('alice').next).toHaveBeenCalled();
    expect(call('alice').res.status).toHaveBeenCalledWith(429);
  });
});
