import { CreditActionType } from './types';

export interface AIRequestPayload {
    prompt?: string;
    image?: string;
    model?: string;
    config?: any;
}

export const callAI = async (actionType: CreditActionType, payload: AIRequestPayload, userId: string) => {
    try {
        const response = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType, payload, userId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || "AI Gatekeeper Error");
        }

        return result.data; // Returns the generated content
    } catch (error: any) {
        console.error("AI Gatekeeper Error:", error.message);
        throw error;
    }
};
