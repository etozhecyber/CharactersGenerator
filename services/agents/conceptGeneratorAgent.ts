
import { Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { CharacterConcept, Language, SelectedTag } from '../../types';
import { ai, languageMap, formatTagsForPrompt } from '../geminiClient';
import { transformPromptToHistory } from "../PromptToHistoryTransformer";

const getPromptForConcepts = (tags: SelectedTag[], language: Language): string => {
    const outputLanguage = languageMap[language] || 'English';
    const baseInstruction = `You are a creative idea generator for role-playing characters. Your task is to create 12 diverse and intriguing character concepts based on the user's requirements.

**CRITICAL: Genre Diversity**
- Your primary goal is to create a DIVERSE set of characters.
- If the user has NOT provided a 'Genre' tag, you MUST NOT default to a single genre like fantasy.
- Instead, create characters from a wide variety of settings: modern day, sci-fi, historical, cyberpunk, slice-of-life, etc.
- The genre should be inferred from the combination of all tags if possible, or be varied if not. Avoid creating only fantasy or medieval characters unless they are specifically requested via tags.

**Output Rules:**
1.  **Format**: Your response MUST be a valid JSON array of 12 objects.
2.  **Structure**: Each object must have two keys: "name" and "description".
3.  **Name**: The 'name' MUST be a creative and fitting name, and it MUST be in English.
4.  **Description**: The 'description' must be a 2-3 sentence summary written in ${outputLanguage}. It should directly explain the character's core concept, personality, and the initial scenario premise, styled like a character card summary on a character sharing website.`;

    const tagsSection = formatTagsForPrompt(tags);

    return `${baseInstruction}\n\n**User Requirements:**\nThe concepts must adhere to the following user requirements:\n${tagsSection}`;
};


export const generateConcepts = async (tags: SelectedTag[], language: Language, model: string = 'gemini-3-flash-preview'): Promise<{ concepts: CharacterConcept[], prompt: object }> => {
    const prompt = getPromptForConcepts(tags, language);
    const historyContents = transformPromptToHistory(prompt);
    
    const request = {
        model: model,
        contents: historyContents,
        config: {
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["name", "description"]
                }
            },
        }
    };

    const response = await ai.models.generateContent(request);

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
        console.error("Failed to parse concept JSON: AI returned an empty response.");
        throw new Error("Received an invalid format from the AI for concepts.");
    }
    try {
        const concepts = JSON.parse(jsonText);
        return { concepts, prompt: request };
    } catch (e) {
        console.error("Failed to parse concept JSON:", jsonText);
        throw new Error("Received an invalid format from the AI for concepts.");
    }
};
