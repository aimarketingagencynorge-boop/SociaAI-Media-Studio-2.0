import type { Request, Response, NextFunction } from 'express';

// Per-process protection for the pilot; use a shared limiter when scaling replicas.
export function createGenerationLimiter(now = Date.now) {
  const users = new Map<string, { start: number; count: number; active: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const uid = req.body.userId as string;
    const time = now();
    for (const [key, value] of users) if (!value.active && time - value.start >= 60_000) users.delete(key);
    let entry = users.get(uid);
    if (!entry) { entry = { start: time, count: 0, active: 0 }; users.set(uid, entry); }
    if (time - entry.start >= 60_000) { entry.start = time; entry.count = 0; }
    if (entry.count >= 20 || entry.active >= 2) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ error: 'Twoja misja jest już w toku. Poczekaj chwilę przed kolejnym generowaniem.' });
      return;
    }
    entry.count++; entry.active++;
    let released = false;
    const release = () => { if (!released) { entry!.active--; released = true; } };
    res.once('finish', release); res.once('close', release);
    next();
  };
}
