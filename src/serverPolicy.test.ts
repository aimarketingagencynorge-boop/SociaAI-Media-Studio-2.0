import { describe, it, expect, vi } from 'vitest';
import { authenticate, validateAIRequest, assertAIResult } from '../serverPolicy';

describe('API access policy', () => {
  const request = async (body: any, token?: string, valid = true) => {
    const req: any = { path: '/ai/execute', headers: { authorization: token }, body };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await authenticate(async () => {
      if (!valid) throw new Error('expired');
      return { uid: 'alice', email: 'alice@example.com' };
    })(req, res, next);
    return { req, res, next };
  };
  it('rejects anonymous requests even with a user ID', async () => {
    const { res, next } = await request({ userId: 'alice' });
    expect(res.status).toHaveBeenCalledWith(401); expect(next).not.toHaveBeenCalled();
  });
  it('rejects expired tokens', async () => {
    expect((await request({}, 'Bearer expired', false)).res.status).toHaveBeenCalledWith(401);
  });
  it('prevents spending another workspace balance', async () => {
    expect((await request({ workspaceId: 'bob' }, 'Bearer valid')).res.status).toHaveBeenCalledWith(403);
  });
  it('uses verified identity rather than a supplied email', async () => {
    const { req, next } = await request({ email: 'someone@example.com', emailVerified: true }, 'Bearer valid');
    expect(req.body.emailVerified).toBe(false);
    expect(next).toHaveBeenCalled();
    expect(req.body).toMatchObject({ userId: 'alice', workspaceId: 'alice', email: 'alice@example.com' });
  });
  it('rejects free ledger actions as generation actions', () => {
    expect(() => validateAIRequest('purchase', { prompt: 'generate an image' })).toThrow();
    expect(() => validateAIRequest('initial_grant', { prompt: 'hello' })).toThrow();
  });
  it('validates prompts and image inputs', () => {
    expect(validateAIRequest('generate_image', { prompt: 'A product photo' })).toBe(25);
    expect(() => validateAIRequest('generate_image', { prompt: ' ' })).toThrow();
    expect(() => validateAIRequest('generate_image', { prompt: 'edit', image: 'https://example.com/a.png' })).toThrow();
  });
  it('does not accept a textual refusal as a generated image', () => {
    expect(() => assertAIResult('generate_image', 'I cannot generate that')).toThrow();
    expect(() => assertAIResult('generate_post', '')).toThrow();
    expect(() => assertAIResult('generate_image', 'data:image/png;base64,YQ==')).not.toThrow();
  });
});
