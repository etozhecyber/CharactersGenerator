import OpenAI from 'openai';
import { ALL_CATEGORIES, CATEGORY_DESCRIPTIONS } from '../constants';
import type { Language, SelectedTag, ApiSettings } from '../types';

export const createOpenAIClient = (settings: ApiSettings) => {
    if (!settings.apiKey) {
        throw new Error("API Key is not set.");
    }
    return new OpenAI({
        apiKey: settings.apiKey,
        baseURL: settings.apiEndpoint || 'https://api.openai.com/v1',
        dangerouslyAllowBrowser: true, // Necessary because we run it in browser
    });
};

// Custom error for easy identification of quota issues.
export class QuotaExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaExceededError";
    }
}

// Prompt utility
export const formatTagsForPrompt = (selectedTags: SelectedTag[]): string => {
    if (selectedTags.length === 0) {
        return "No specific tags provided. You have complete creative freedom.";
    }

    const groupedTags: { [key: string]: string[] } = {};
    for (const selectedTag of selectedTags) {
        const { categoryId, tag } = selectedTag;
        if (!groupedTags[categoryId]) {
            groupedTags[categoryId] = [];
        }
        groupedTags[categoryId].push(tag);
    }
    
    return Object.entries(groupedTags)
        .map(([categoryId, tagList]) => {
            if (categoryId === 'other') {
                return `### Other/Uncategorized Tags\n*User-selected tags*: ${tagList.join(', ')}`;
            }

            const description = CATEGORY_DESCRIPTIONS[categoryId] || "General user requirements.";
            const categoryName = categoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return `### ${categoryName}\n*Category Description*: ${description}\n*User-selected tags*: ${tagList.join(', ')}`;
        })
        .join('\n\n');
};

// Tag to Category mapping
let tagToCategoryMap: Map<string, string> | null = null;

export const initializeTagMap = async (): Promise<Map<string, string>> => {
    if (tagToCategoryMap) return tagToCategoryMap; // Return map if already initialized
    const map = new Map<string, string>();
    await Promise.all(
        ALL_CATEGORIES.map(async (categoryId) => {
            try {
                const response = await fetch(`/data/tags/${categoryId.replace('-', '_')}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const tags: string[] = await response.json();
                for (const tag of tags) {
                    map.set(tag, categoryId);
                }
            } catch (e) {
                console.error(`Failed to load tags for category: ${categoryId}`, e);
            }
        })
    );
    tagToCategoryMap = map;
    return tagToCategoryMap;
};

// Language map
export const languageMap: Record<Language, string> = {
    en: 'English',
    ru: 'Russian',
};
