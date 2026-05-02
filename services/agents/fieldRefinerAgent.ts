import type { FullCharacter, GenerationModel, Language, ApiSettings } from '../../types';
import { createOpenAIClient, languageMap } from '../openaiClient';
import { fieldSpecificInstructions } from '../promptFragments';

interface RefineFieldOptions {
    fullCharacterData: FullCharacter;
    fieldToRefine: keyof FullCharacter;
    userInstruction: string;
    originalPromptObject: any;
    model: GenerationModel;
    fieldIndex?: number | null;
    language: Language;
    apiSettings: ApiSettings;
}

const getPromptForRefinement = (options: RefineFieldOptions): string => {
    const { fullCharacterData, fieldToRefine, userInstruction, originalPromptObject, fieldIndex, language } = options;
    
    const fieldRule = fieldSpecificInstructions[fieldToRefine] || "No specific rules for this field.";
    const outputLanguage = languageMap[language] || 'English';

    const currentContent = (fieldToRefine === 'alternate_greetings' && typeof fieldIndex === 'number')
        ? fullCharacterData.alternate_greetings[fieldIndex]
        : fullCharacterData[fieldToRefine] as string;

    const originalGenerationPrompt = originalPromptObject?.messages?.[0]?.content || "No original prompt provided.";
    
    const dialogueFields: Array<keyof FullCharacter> = ['first_mes', 'alternate_greetings', 'mes_example'];
    const requiresSpecificLanguage = dialogueFields.includes(fieldToRefine);

    return `You are an expert character writer's assistant. Your task is to refine a specific part of a character card based on user feedback, while ensuring the change remains consistent with the character's overall profile and the original creation guidelines.

**CHARACTER CONTEXT (ENTIRE CARD):**
${JSON.stringify(fullCharacterData, null, 2)}

**ORIGINAL GENERATION INSTRUCTIONS (TAGS):**
${originalGenerationPrompt}

---

**REFINEMENT TASK:**
- **Field to Refine:** ${fieldToRefine}${typeof fieldIndex === 'number' ? ` (Greeting #${fieldIndex + 1})` : ''}
- **Original Rules for this Field:**
"""
${fieldRule}
"""
- **Current Content of the Field:**
"""
${currentContent}
"""
- **User's Instruction for Refinement:**
"""
${userInstruction}
"""

**Your Goal:**
Your response must be a JSON object that adheres to the provided schema. Rewrite the content for the specified field based on the user's instruction, while also respecting the **"Original Rules for this Field"**.
- Maintain consistency with the rest of the character card's personality, tone, and backstory.
- **CRITICAL:** Ensure the output language for the content is **${requiresSpecificLanguage ? outputLanguage : 'English'}**.
`;
};

export const refineField = async (options: RefineFieldOptions): Promise<{ refinedContent: string, request: object }> => {
    if (!options.model) {
        throw new Error("Model for generation is not selected. Please specify it in the settings.");
    }
    
    const prompt = getPromptForRefinement(options);
    const openai = createOpenAIClient(options.apiSettings);

    const request = {
        model: options.model,
        messages: [{ role: "user" as const, content: prompt }],
        response_format: {
            type: "json_schema" as const,
            json_schema: {
                name: "field_refinement",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        refinedContent: {
                            type: "string",
                            description: "The rewritten, refined text for the specified field. This output MUST ONLY be the new content, adhering to the original rules for the field. Do not include any other explanations, labels, or markdown formatting (unless it is part of the content itself like in 'mes_example')."
                        },
                    },
                    required: ["refinedContent"],
                    additionalProperties: false
                }
            }
        }
    };

    try {
        const response = await openai.chat.completions.create(request);
        
        const jsonText = response.choices[0]?.message?.content?.trim() || '';

        if (!jsonText) {
            throw new Error("The AI returned an empty response for refinement.");
        }

        try {
            const result = JSON.parse(jsonText);
            if (result.refinedContent === undefined || result.refinedContent === null) {
                throw new Error("Invalid JSON structure: 'refinedContent' field is missing.");
            }
            return { refinedContent: String(result.refinedContent), request };
        } catch (e) {
            console.error("Failed to parse refinement JSON:", jsonText, e);
            throw new Error(`Received an invalid JSON format from the AI for refinement. Error: ${e instanceof Error ? e.message : String(e)}`);
        }

    } catch (e) {
        console.error("Error during field refinement:", e);
        throw new Error(`AI refinement failed. Please check the console for details. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
};
