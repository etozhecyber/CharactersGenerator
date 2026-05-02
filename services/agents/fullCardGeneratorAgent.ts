import type { CharacterConcept, FullCharacter, GenerationModel, SelectedTag, Language, ApiSettings } from '../../types';
import { createOpenAIClient, formatTagsForPrompt, languageMap } from '../openaiClient';
import { fieldSpecificInstructions } from '../promptFragments';

const getPromptForFullCard = (concept: CharacterConcept, tags: SelectedTag[], outputLanguage: string): string => {
    const tagsSection = formatTagsForPrompt(tags);

    return `You are a world-class character writer for interactive fiction and role-playing scenarios, with a talent for creating vivid, deep, and engaging characters that feel alive.

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
Your primary goal is to generate a character card that is **fundamentally shaped** by the user-provided tags. These tags are not mere suggestions; they are the core rules for the character's identity, the world they inhabit, and the style of your writing.

**LANGUAGE REQUIREMENTS - ABSOLUTE PRIORITY:**
- The fields \`name\`, \`description\`, \`personality\`, and \`scenario\` MUST be written in **English**.
- The fields \`first_mes\`, \`alternate_greetings\`, and \`mes_example\` MUST be written in **${outputLanguage}**. This is an absolute requirement, even if the tags or concepts are in English.

- **Meta & Tone Tags are KING:** Tags from the 'Meta' and 'Tone' categories (e.g., 'NSFW', 'Horror', 'Wholesome', 'Slice of Life') are the most important. They dictate the entire mood, writing style, and appropriate content level. A 'Horror' tag MUST result in a genuinely unsettling card, while a 'Wholesome' tag MUST produce something heartwarming and safe. The entire output should reflect this.
- **Blend and Balance Tags:** Do not let one single tag dominate the entire character, especially if it's a strong theme. Instead, creatively blend the influences of all selected tags. For example, if 'Romance' and 'Horror' are both selected, the result should not just be a horror story; it should be a romantic horror story, finding ways to merge both themes. A 'Shy' but 'Sadistic' character might show their sadistic side only in private moments. Find the interesting intersections and nuanced expressions that arise from the combination of tags.
- **Consistency is Key:** Every field in the generated JSON, from 'description' to 'mes_example', must be consistent with the specified tags. A 'sadistic' character should not have a 'sweet' first message unless specified by another contradictory tag (e.g., 'hiding their true nature').

---
**Initial Concept to Expand:**
- **Name:** ${concept.name}
- **Brief Description:** "${concept.description}"

**User's Detailed Requirements (Tags MUST be followed):**
${tagsSection}
---

**Quality Benchmarks & Writing Style:**
- **Immersive & Evocative:** Use sensory details. Don't just tell, show. Make the character feel real and compelling.
- **Structured & Organized:** For the 'description' field, use Markdown headings (e.g., \`## Background\`, \`## Appearance\`, \`## Personality\`) for excellent readability.
- **Consistent Voice:** The character's personality must be consistent across all fields, especially their description, personality breakdown, and dialogue examples.
- **Engaging Hooks:** The opening messages (\`first_mes\` and \`alternate_greetings\`) are critical for starting the roleplay. They must be compelling and draw the user into the scene immediately.

The final character must strictly adhere to ALL of the user-provided requirements, especially the tags. Your response must be a single, valid JSON object that conforms to the provided schema. Now, generate the complete character card.`;
};

export const generateFullCard = async (
    concept: CharacterConcept, 
    tags: SelectedTag[], 
    model: GenerationModel, 
    language: Language,
    apiSettings: ApiSettings
): Promise<{character: FullCharacter, prompt: object}> => {
    if (!model) {
        throw new Error("Model for card generation is not selected. Please specify it in the settings.");
    }
    
    const outputLanguage = languageMap[language] || 'English';
    const prompt = getPromptForFullCard(concept, tags, outputLanguage);
    const openai = createOpenAIClient(apiSettings);
    
    const englishInstruction = "**Language Rule**: This field MUST be written in **English**.";
    
    // Dynamically add language instruction to relevant field descriptions
    const dynamicFieldInstructions = {
        ...fieldSpecificInstructions,
        name: `${fieldSpecificInstructions.name}\n${englishInstruction}`,
        description: `${fieldSpecificInstructions.description}\n${englishInstruction}`,
        personality: `${fieldSpecificInstructions.personality}\n${englishInstruction}`,
        scenario: `${fieldSpecificInstructions.scenario}\n${englishInstruction}`,
        first_mes: `${fieldSpecificInstructions.first_mes}\n**Language Rule**: This field MUST be written in **${outputLanguage}**.`,
        alternate_greetings: `${fieldSpecificInstructions.alternate_greetings}\n**Language Rule**: Each greeting in this array MUST be written in **${outputLanguage}**.`,
        mes_example: `${fieldSpecificInstructions.mes_example}\n**Language Rule**: The entire dialogue example, including BOTH the '{{user}}' and '{{char}}' parts, MUST be written in **${outputLanguage}**.`,
    };

    const request = {
        model: model,
        messages: [{ role: "user" as const, content: prompt }],
        response_format: {
            type: "json_schema" as const,
            json_schema: {
                name: "full_character_card",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: dynamicFieldInstructions.name },
                        description: { type: "string", description: dynamicFieldInstructions.description },
                        personality: { type: "string", description: dynamicFieldInstructions.personality },
                        first_mes: { type: "string", description: dynamicFieldInstructions.first_mes },
                        alternate_greetings: {
                            type: "array",
                            items: { type: "string" },
                            description: dynamicFieldInstructions.alternate_greetings
                        },
                        mes_example: { type: "string", description: dynamicFieldInstructions.mes_example },
                        scenario: { type: "string", description: dynamicFieldInstructions.scenario },
                    },
                    required: ["name", "description", "personality", "first_mes", "alternate_greetings", "mes_example", "scenario"],
                    additionalProperties: false
                }
            }
        }
    };

    const response = await openai.chat.completions.create(request);
    
    const jsonText = response.choices[0]?.message?.content?.trim() || '';
    if (!jsonText) {
        console.error("Failed to parse full card JSON: AI returned an empty response.");
        throw new Error("Received an invalid format from the AI for the character card.");
    }
    
    try {
        const raw = JSON.parse(jsonText);
        // Normalize all string fields — some models may return an object instead of a string
        const stringFields: Array<keyof FullCharacter> = ['name', 'description', 'personality', 'first_mes', 'mes_example', 'scenario'];
        const character: FullCharacter = { ...raw };
        for (const field of stringFields) {
            const val = raw[field];
            if (typeof val !== 'string') {
                console.warn(`Field "${field}" was not a string (got ${typeof val}), converting...`, val);
                character[field] = typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : String(val ?? '');
            }
        }
        // Ensure alternate_greetings is an array of strings
        if (!Array.isArray(character.alternate_greetings)) {
            character.alternate_greetings = [];
        } else {
            character.alternate_greetings = character.alternate_greetings.map((g: unknown) =>
                typeof g === 'string' ? g : (typeof g === 'object' && g !== null ? JSON.stringify(g, null, 2) : String(g ?? ''))
            );
        }
        return { character, prompt: request };
    } catch (e) {
        console.error("Failed to parse full card JSON:", jsonText);
        throw new Error("Received an invalid format from the AI for the character card.");
    }
};