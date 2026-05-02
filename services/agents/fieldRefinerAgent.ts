
import { Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { FullCharacter, GenerationModel, Language } from '../../types';
import { ai, languageMap } from '../geminiClient';
import { fieldSpecificInstructions } from '../promptFragments';
import { transformPromptToHistory } from '../PromptToHistoryTransformer';

interface RefineFieldOptions {
    fullCharacterData: FullCharacter;
    fieldToRefine: keyof FullCharacter;
    userInstruction: string;
    originalPromptObject: any;
    model: GenerationModel;
    fieldIndex?: number | null;
    language: Language;
}

const getPromptForRefinement = (options: RefineFieldOptions): string => {
    const { fullCharacterData, fieldToRefine, userInstruction, originalPromptObject, fieldIndex, language } = options;
    
    const fieldRule = fieldSpecificInstructions[fieldToRefine] || "No specific rules for this field.";
    const outputLanguage = languageMap[language] || 'English';

    const currentContent = (fieldToRefine === 'alternate_greetings' && typeof fieldIndex === 'number')
        ? fullCharacterData.alternate_greetings[fieldIndex]
        : fullCharacterData[fieldToRefine] as string;

    const originalGenerationPrompt = originalPromptObject?.contents || "No original prompt provided.";
    
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
    const prompt = getPromptForRefinement(options);
    const historyContents = transformPromptToHistory(prompt);

    const request = {
        model: options.model,
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
                    refinedContent: {
                        type: Type.STRING,
                        description: "The rewritten, refined text for the specified field. This output MUST ONLY be the new content, adhering to the original rules for the field. Do not include any other explanations, labels, or markdown formatting (unless it is part of the content itself like in 'mes_example')."
                    },
                },
                required: ["refinedContent"]
            },
        }
    };

    try {
        const response = await ai.models.generateContent(request);

        if (response.promptFeedback?.blockReason) {
             console.error("Field refinement blocked by safety filters.", response.promptFeedback);
            throw new Error(`The AI refused to refine the content due to safety policies (Reason: ${response.promptFeedback.blockReason}).`);
        }
        
        const jsonText = (response.text ?? '').trim();

        if (!jsonText) {
            const finishReason = response.candidates?.[0]?.finishReason;
            let errorMessage = "The AI returned an empty response for refinement.";
             if (finishReason === 'SAFETY') {
                errorMessage = "The refined content was blocked by safety filters.";
            } else if (finishReason) {
                errorMessage += ` Finish reason: ${finishReason}.`;
            }
            throw new Error(errorMessage);
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
