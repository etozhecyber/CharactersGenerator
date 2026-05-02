import { useMemo } from 'react';

/**
 * A simple word-based token counter approximation.
 * In English, 1 token is often close to one word.
 * @param text The text to count tokens for.
 * @returns The approximate number of tokens.
 */
export const countTokens = (text: string | null | undefined): number => {
    if (!text) {
        return 0;
    }
    // This is a simple approximation that splits by whitespace and counts the segments.
    // It serves as a reasonable client-side proxy for Gemini's tokenizer for estimation purposes.
    return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * A hook that provides a memoized token count for a given text.
 * @param text The text to count tokens for.
 * @returns The memoized approximate number of tokens.
 */
export const useTokenCounter = (text: string | null | undefined): number => {
    return useMemo(() => countTokens(text), [text]);
};
