import { apiFetch } from './apiClient';
import { CreditActionType } from './types';

export interface AIRequestPayload {
    prompt?: string;
    image?: string;
    model?: string;
    config?: any;
}

export const callAI = async (actionType: CreditActionType, payload: AIRequestPayload, userId: string, workspaceId: string) => {
    try {
        // Generated assets are stored as URLs; Gemini expects inline image bytes for edits.
        if (payload.image?.startsWith('https://')) {
            const imageResponse = await fetch(payload.image);
            if (!imageResponse.ok) throw new Error('Nie udało się pobrać obrazu źródłowego.');
            const blob = await imageResponse.blob();
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(blob.type) || blob.size > 15 * 1024 * 1024) {
                throw new Error('Użyj obrazu PNG, JPEG lub WebP o rozmiarze do 15 MB.');
            }
            const image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Nie udało się odczytać obrazu.'));
                reader.readAsDataURL(blob);
            });
            payload = { ...payload, image };
        }
        const response = await apiFetch('/api/ai/execute', {
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
                throw new Error(`AI Gatekeeper Error: Invalid JSON response from server. Status: ${response.status}.`);
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
