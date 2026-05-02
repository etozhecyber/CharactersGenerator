import type { FullCharacter, GenerationModel, SelectedTag } from '../types';

interface ExportOptions {
    characterData: FullCharacter;
    appVersion: string;
    generationModel: GenerationModel;
    selectedTags: SelectedTag[];
}

/**
 * Creates a JSON file in the TavernAI Character Card v2 format and triggers a download.
 * @param options - The data needed to build and export the character card.
 */
export const exportCharacterCard = ({ characterData, appVersion, generationModel, selectedTags }: ExportOptions): void => {
    if (!characterData) {
        console.error("Export failed: character data is missing.");
        return;
    }

    const creationDate = new Date().toISOString();

    // Construct the card data according to the V2 spec.
    const exportData = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
            // Spread all the fields from the character data
            ...characterData,
            
            // Add or overwrite fields to match the V2 spec
            creator_notes: "",
            system_prompt: "",
            post_history_instructions: "",
            tags: selectedTags.map(t => t.tag),
            creator: `Cyber's RP characters generator v${appVersion}`,
            character_version: `generation date: ${creationDate}`,
            
            // App-specific metadata goes into the extensions object, as per spec.
            extensions: {
                cybers_rp_characters_generator: {
                    version: appVersion,
                    generation_model: generationModel,
                    // Store detailed tags with categories for potential re-import or debugging.
                    selected_tags: selectedTags,
                    generation_date: creationDate,
                }
            }
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize name for a safe filename
    const safeName = (characterData.name || 'character').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeName}_v2_character.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
