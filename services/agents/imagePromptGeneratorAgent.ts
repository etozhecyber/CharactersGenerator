import { createOpenAIClient } from '../openaiClient';
import type { FullCharacter, ApiSettings } from '../../types';

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


export const generateImagePrompt = async (
    character: FullCharacter,
    model: string,
    apiSettings: ApiSettings
): Promise<{ imagePrompt: string, request: object }> => {
    if (!model) {
        throw new Error("Model for generation is not selected. Please specify it in the settings.");
    }

    const promptText = getPromptForImagePrompt(character);
    const openai = createOpenAIClient(apiSettings);

    const request = {
        model: model,
        messages: [{ role: "user" as const, content: promptText }],
        response_format: {
            type: "json_schema" as const,
            json_schema: {
                name: "image_prompt",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        imagePrompt: {
                            type: "string",
                            description: "A single, comma-separated string of keywords and short phrases that is strictly SFW, based on the character description. This prompt must not contain any labels or extra text. It must be in English."
                        },
                    },
                    required: ["imagePrompt"],
                    additionalProperties: false
                }
            }
        }
    };

    const response = await openai.chat.completions.create(request);

    const jsonText = response.choices[0]?.message?.content?.trim() || '';

    if (!jsonText) {
        throw new Error("The AI returned an empty response for the image prompt.");
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
