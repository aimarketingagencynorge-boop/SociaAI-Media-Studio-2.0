import type { Request, Response, NextFunction } from 'express';
import { AI_COSTS } from './types';

export function authenticate(verify: (token: string) => Promise<{ uid: string; email?: string; email_verified?: boolean }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health') return next();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return void res.status(401).json({ error: 'Sign in required' });
    try {
      const user = await verify(token);
      const body = req.body || {};
      if ((body.userId && body.userId !== user.uid) ||
          (body.workspaceId && body.workspaceId !== user.uid)) {
        return void res.status(403).json({ error: 'Workspace access denied' });
      }
      req.body = { ...body, userId: user.uid, workspaceId: user.uid, email: user.email || '', emailVerified: user.email_verified === true };
      next();
    } catch {
      res.status(401).json({ error: 'Session expired. Sign in again.' });
    }
  };
}

export function validateAIRequest(action: unknown, payload: any) {
  const allowed = ['scan_brand', 'generate_post', 'generate_image', 'generate_video', 'ai_enhance'];
  if (typeof action !== 'string' || !allowed.includes(action)) throw new Error('Unsupported AI action');
  if (!payload || typeof payload.prompt !== 'string' || !payload.prompt.trim() || payload.prompt.length > 60000) {
    throw new Error('A prompt between 1 and 60000 characters is required');
  }
  if (payload.image && (typeof payload.image !== 'string' ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(payload.image))) {
    throw new Error('Reference image must be a PNG, JPEG or WebP data URL');
  }
  return AI_COSTS[action as keyof typeof AI_COSTS];
}

export function assertAIResult(action: string, result: string) {
  if (!result?.trim()) throw new Error('AI returned an empty result. Please retry.');
  if (action === 'generate_image' && !/^data:image\//.test(result)) {
    throw new Error('AI did not return an image. Please revise your description and retry.');
  }
  if (action === 'generate_video' && !/^data:video\//.test(result)) {
    throw new Error('AI did not return a video. Please retry.');
  }
}
