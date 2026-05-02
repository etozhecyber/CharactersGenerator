import { Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { CharacterConcept, FullCharacter, GenerationModel, SelectedTag, Language } from '../../types';
import { ai, formatTagsForPrompt, languageMap } from '../geminiClient';
import { fieldSpecificInstructions } from '../promptFragments';
import { transformPromptToHistory } from '../PromptToHistoryTransformer';

const getPromptForFullCard = (concept: CharacterConcept, tags: SelectedTag[]): string => {
    const tagsSection = formatTagsForPrompt(tags);

    // This prompt is structured to heavily emphasize the user's tags as the primary driver of the output.
    return `You are a world-class character writer for interactive fiction and role-playing scenarios, with a talent for creating vivid, deep, and engaging characters that feel alive.

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
Your primary goal is to generate a character card that is **fundamentally shaped** by the user-provided tags. These tags are not mere suggestions; they are the core rules for the character's identity, the world they inhabit, and the style of your writing.

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

export const generateFullCard = async (concept: CharacterConcept, tags: SelectedTag[], model: GenerationModel, language: Language): Promise<{character: FullCharacter, prompt: object}> => {
    const prompt = getPromptForFullCard(concept, tags);
    const historyContents = transformPromptToHistory(prompt);
    const outputLanguage = languageMap[language] || 'English';
    const englishInstruction = "**Language Rule**: This field MUST be written in **English**.";
    
    // Dynamically add language instruction to relevant field descriptions
    const dynamicFieldInstructions = {
        ...fieldSpecificInstructions,
        // These fields are ALWAYS in English
        name: `${fieldSpecificInstructions.name}\n${englishInstruction}`,
        description: `${fieldSpecificInstructions.description}\n${englishInstruction}`,
        personality: `${fieldSpecificInstructions.personality}\n${englishInstruction}`,
        scenario: `${fieldSpecificInstructions.scenario}\n${englishInstruction}`,

        // These fields follow the selected card generation language
        first_mes: `${fieldSpecificInstructions.first_mes}\n**Language Rule**: This field MUST be written in **${outputLanguage}**.`,
        alternate_greetings: `${fieldSpecificInstructions.alternate_greetings}\n**Language Rule**: Each greeting in this array MUST be written in **${outputLanguage}**.`,
        mes_example: `${fieldSpecificInstructions.mes_example}\n**Language Rule**: The entire dialogue example, including BOTH the '{{user}}' and '{{char}}' parts, MUST be written in **${outputLanguage}**.`,
    };

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
            // The JSON schema now contains the detailed instructions for each field,
            // making it the single source of truth for generation rules.
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.name
                    },
                    description: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.description
                    },
                    personality: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.personality
                    },
                    first_mes: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.first_mes
                    },
                    alternate_greetings: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: dynamicFieldInstructions.alternate_greetings
                    },
                    mes_example: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.mes_example
                    },
                    scenario: { 
                        type: Type.STRING,
                        description: dynamicFieldInstructions.scenario
                    },
                },
                required: ["name", "description", "personality", "first_mes", "alternate_greetings", "mes_example", "scenario"]
            },
        }
    };

    const response = await ai.models.generateContent(request);

    // More robust error handling
    if (response.promptFeedback?.blockReason) {
        console.error("Full card generation blocked by safety filters.", response.promptFeedback);
        throw new Error(`The AI refused to generate the character due to safety policies (Reason: ${response.promptFeedback.blockReason}). Please try modifying your tags or concept.`);
    }
    
    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        console.error("Failed to parse full card JSON: AI returned an empty response.", `Finish Reason: ${finishReason}`);

        let errorMessage = "Received an invalid format from the AI for the character card.";
        if (finishReason === 'SAFETY') {
             errorMessage = "The response was blocked by safety filters. Please try modifying your tags or concept.";
        } else if (finishReason === 'MAX_TOKENS') {
            errorMessage = "The generation stopped because it reached the maximum token limit. The prompt might be too long or the requested response too large.";
        } else if (finishReason) {
            errorMessage += ` The generation finished unexpectedly with reason: ${finishReason}.`;
        }
        
        throw new Error(errorMessage);
    }
    
    try {
        const character = JSON.parse(jsonText);
        return { character, prompt: request };
    } catch (e) {
        console.error("Failed to parse full card JSON:", jsonText);
        throw new Error("Received an invalid format from the AI for the character card.");
    }
};