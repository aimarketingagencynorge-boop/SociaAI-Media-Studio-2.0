import { AI_COSTS } from './types';

// Trial grant is issued only after card verification and subscription acceptance.
export const STARTER_CREDITS = 500;
export const WEEK_PLAN_COST = AI_COSTS.generate_post;
export const IMAGE_WITH_BRIEF_COST = AI_COSTS.generate_image + AI_COSTS.ai_enhance;

export function starterBalance(existing?: { creditBalance?: number; starterCreditsGranted?: boolean }) {
  // Never replenish an existing wallet, even if a legacy grant marker is missing.
  return existing ? Math.max(0, Number.isFinite(existing.creditBalance) ? existing.creditBalance! : 0) : 0;
}
