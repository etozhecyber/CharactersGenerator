
import { Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { ai } from '../geminiClient';
import type { FullCharacter } from '../../types';
import { transformPromptToHistory } from '../PromptToHistoryTransformer';

const getPromptForImagePrompt = (character: FullCharacter): string => {
    const { name, description } = character;

    return `You are an expert AI content moderator and prompt engineer. Your primary goal is to generate a text-to-image prompt from a character description that is **guaranteed to be Safe-For-Work (SFW)** and will not trigger safety filters of image generation models like Imagen.

**Input Character Details:**
- Name: ${name}
- Description:
${description}

---
**Core Task:**
Analyze the character's description and create a detailed, visual, and strictly SFW image prompt.

**CRITICAL SAFETY & MODERATION RULES:**
1.  **SFW is Non-Negotiable:** Your primary directive is to produce an SFW prompt. The prompt must be clean and appropriate for all audiences.
2.  **Filter and Translate, Not Copy:** The input description might contain explicit NSFW, suggestive, or violent terms. You MUST NOT include these words in the output. Instead, you must translate the *visual intent* into SFW alternatives.
3.  **Preserve Intent, Not Words:** Your goal is to capture the character's appearance without using problematic language.
    -   **Bad:** If the input mentions "huge breasts", DO NOT use that phrase in the output.
    -   **Good:** Translate it to "curvaceous figure", "voluptuous", or "well-endowed", which are less likely to be flagged.
    -   **Bad:** If the input mentions "nude" or other explicit terms, DO NOT use them.
    -   **Good:** Translate it to "artistic figure", "sculpted physique", or describe them wearing something appropriate like "ethereal, flowing silks".
4.  **Focus on Visuals:** Extract and combine descriptive keywords about physical appearance (face, hair, body type), clothing, accessories, and mood. Prioritize the 'Appearance' section of the description if available.

**Example of a translation from a potentially NSFW description:**
-   **Input Description implies:** "A busty demon in revealing leather armor"
-   **Your SFW Output Prompt Should Be:** "fantasy character portrait, a female demon with a curvaceous figure, wearing ornate dark leather armor, detailed, cinematic lighting, sharp horns, glowing red eyes, mischievous smirk"

Now, based on the provided character details, generate the SFW image prompt according to the JSON schema.
`;
};


export const generateImagePrompt = async (character: FullCharacter): Promise<{ imagePrompt: string, request: object }> => {
    const promptText = getPromptForImagePrompt(character);
    const historyContents = transformPromptToHistory(promptText);

    const request = {
        model: 'gemini-flash-latest',
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
                type: Type.OBJECT,
                properties: {
                    imagePrompt: {
                        type: Type.STRING,
                        description: "A single, comma-separated string of keywords and short phrases that is strictly SFW, based on the character description. This prompt must not contain any labels or extra text. It must be in English."
                    },
                },
                required: ["imagePrompt"]
            },
        }
    };

    const response = await ai.models.generateContent(request);

    if (response.promptFeedback?.blockReason) {
        const reason = response.promptFeedback.blockReason;
        const safetyRatings = response.promptFeedback.safetyRatings?.map(r => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`).join(', ');
        console.error("Image prompt generation blocked by safety filters.", response.promptFeedback);
        throw new Error(`Prompt generation was blocked. Reason: ${reason}. Details: ${safetyRatings || 'N/A'}`);
    }

    const jsonText = (response.text ?? '').trim();

    if (!jsonText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const finishMessage = response.candidates?.[0]?.finishMessage;
        console.error("Failed to generate image prompt: AI returned an empty response.", `Finish Reason: ${finishReason}`, `Message: ${finishMessage}`);

        let errorMessage = "The AI returned an empty response for the image prompt.";
        if (finishReason && finishReason !== 'STOP') {
            errorMessage = `Generation failed unexpectedly. Reason: ${finishReason}.`;
            if (finishMessage) {
                errorMessage += ` Details: ${finishMessage}`;
            }
        }
        
        throw new Error(errorMessage);
    }
    
    try {
        const result = JSON.parse(jsonText);
        if (!result.imagePrompt || typeof result.imagePrompt !== 'string') {
            throw new Error("Invalid JSON structure: 'imagePrompt' field is missing or not a string.");
        }
        return { imagePrompt: result.imagePrompt, request: request };
    } catch (e) {
        console.error("Failed to parse image prompt JSON:", jsonText, e);
        throw new Error(`Received an invalid JSON format from the AI for the image prompt. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
};
