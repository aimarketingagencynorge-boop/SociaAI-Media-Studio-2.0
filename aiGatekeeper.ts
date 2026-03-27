import { CreditActionType } from './types';

export interface AIRequestPayload {
    prompt?: string;
    image?: string;
    model?: string;
    config?: any;
}

export const callAI = async (actionType: CreditActionType, payload: AIRequestPayload, userId: string, workspaceId: string) => {
    try {
        const response = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType, payload, userId, workspaceId })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            let result;
            try {
                result = await response.json();
            } catch (jsonError: any) {
                const text = await response.text();
                throw new Error(`AI Gatekeeper Error: Invalid JSON response from server. Status: ${response.status}. Body: ${text.slice(0, 100)}...`);
            }
            
            if (!response.ok) {
                throw new Error(result.message || result.error || `AI Gatekeeper Error (${response.status})`);
            }
            return result.result;
        } else {
            const text = await response.text();
            throw new Error(`AI Gatekeeper Error: Server returned non-JSON response (${response.status}). Content-Type: ${contentType}. Body: ${text.slice(0, 100)}...`);
        }
    } catch (error: any) {
        console.error("AI Gatekeeper Error:", error.message);
        throw error;
    }
};
