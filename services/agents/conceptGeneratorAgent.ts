import type { CharacterConcept, Language, SelectedTag, ApiSettings } from '../../types';
import { createOpenAIClient, languageMap, formatTagsForPrompt } from '../openaiClient';

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

export const generateConcepts = async (
    tags: SelectedTag[],
    language: Language,
    model: string,
    apiSettings: ApiSettings
): Promise<{ concepts: CharacterConcept[], prompt: object }> => {
    if (!model) {
        throw new Error("Model for concept generation is not selected. Please specify it in the settings.");
    }
    const prompt = getPromptForConcepts(tags, language);
    const openai = createOpenAIClient(apiSettings);

    const request = {
        model: model,
        messages: [{ role: "user" as const, content: prompt }],
        response_format: {
            type: "json_schema" as const,
            json_schema: {
                name: "character_concepts",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        concepts: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                },
                                required: ["name", "description"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["concepts"],
                    additionalProperties: false
                }
            }
        }
    };

    const response = await openai.chat.completions.create(request);

    const jsonText = response.choices[0]?.message?.content?.trim() || '';
    if (!jsonText) {
        console.error("Failed to parse concept JSON: AI returned an empty response.");
        throw new Error("Received an invalid format from the AI for concepts.");
    }
    try {
        const parsed = JSON.parse(jsonText);
        return { concepts: parsed.concepts, prompt: request };
    } catch (e) {
        console.error("Failed to parse concept JSON:", jsonText);
        throw new Error("Received an invalid format from the AI for concepts.");
    }
};
