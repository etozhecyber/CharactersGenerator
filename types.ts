
export type CharacterConcept = {
    name: string;
    description: string;
};

export type FullCharacter = {
    name: string;
    description: string;
    personality: string;
    first_mes: string;
    alternate_greetings: string[];
    mes_example: string;
    scenario: string;
};

export type TagCategory = {
    id: string;
    tags: string[];
    description: string;
};

export type SelectedTag = {
    categoryId: string;
    tag: string;
};

export type Language = 'en' | 'ru';

export type GalleryViewMode = 'grid' | 'table';

export type GenerationModel = string;

export type ApiSettings = {
    apiKey: string;
    apiEndpoint: string;
};

export type LocaleMessages = {
    [key: string]: string;
};
