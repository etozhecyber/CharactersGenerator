import { ai, QuotaExceededError } from '../geminiClient';
import { Modality, GenerateContentResponse } from '@google/genai';

export const generateAvatar = async (prompt: string): Promise<{ imageBytes: string }> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                // The guidelines for this model specify using both TEXT and IMAGE modalities.
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Case 1: The entire request was blocked by a safety filter.
        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            const safetyRatings = response.promptFeedback.safetyRatings?.map((r: any) => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`).join(', ');
            const errorMessage = `Image generation was blocked by safety filters. Reason: ${reason}. Details: ${safetyRatings || 'N/A'}`;
            console.error(errorMessage, response);
            throw new Error(errorMessage);
        }

        const candidate = response.candidates?.[0];
        if (!candidate) {
             const errorMessage = `Image generation failed: The AI did not return any candidates. The prompt may be invalid or the service may be temporarily unavailable.`;
            console.error(errorMessage, response);
            throw new Error(errorMessage);
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const errorMessage = `Image generation finished unexpectedly. Reason: ${candidate.finishReason}. Message: ${candidate.finishMessage || 'N/A'}`;
             console.error(errorMessage, response);
            throw new Error(errorMessage);
        }

        // Find the image part in the response
        let imageBytes: string | undefined;
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                imageBytes = part.inlineData.data;
                break;
            }
        }
        
        // Case 2: No image part was found in the response.
        if (!imageBytes) {
            const errorMessage = `Image generation succeeded, but the AI failed to provide valid image data. This may be a temporary API issue.`;
            console.error(errorMessage, candidate);
            throw new Error(errorMessage);
        }

        // If all checks pass, we have a valid image.
        return { imageBytes };

    } catch (error: any) {
        // Handle specific known errors from the API call itself.
        if (error.message && typeof error.message === 'string' && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.toLowerCase().includes('quota'))) {
            console.warn("[generateAvatar] Detected quota exceeded error.");
            throw new QuotaExceededError("Image generation quota has been exceeded. Please try again later.");
        }
        
        // If it's an error we threw inside the `try` block, or any other standard Error, just let it pass through.
        if (error instanceof Error) {
            throw error;
        }

        // For any other type of unknown error.
        console.error("[generateAvatar] An unexpected error occurred:", error);
        throw new Error(`An unexpected error occurred during image generation: ${String(error)}`);
    }
};
