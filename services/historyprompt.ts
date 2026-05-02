import type { Content } from "@google/genai";

/**
 * Transforms a string prompt into a chat history format.
 * This is used to potentially improve model responses and reduce safety filter issues
 * by framing the request as a continuation of a conversation.
 * @param prompt - The original string prompt.
 * @returns An array of Content objects for the Gemini API.
 */
export const transformPromptToHistory = (prompt: string): Content[] => {
    return [
        {
            role: "user",
            parts: [{ text: prompt }],
        },
        {
            role: "model",
            // This special character prompts the model to continue the generation.
            parts: [{ text: "➛" }],
        },
    ];
};
