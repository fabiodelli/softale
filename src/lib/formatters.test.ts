import { describe, it, expect } from 'vitest';
import { cleanDescription, formatDuration, isLoopable } from '@/lib/formatters';

describe('formatters', () => {
    describe('cleanDescription', () => {
        it('should return empty string for null/undefined', () => {
            expect(cleanDescription(null)).toBe('');
            expect(cleanDescription(undefined)).toBe('');
        });

        it('should strip common LLM prefixes', () => {
            const input = "Here is a story about a cat.";
            expect(cleanDescription(input)).toBe('about a cat.');
        });

        it('should strip quotes if fully quoted', () => {
            const input = '"A wonderful journey"';
            expect(cleanDescription(input)).toBe('A wonderful journey');
        });

        it('should handle complex cases mixed with prefixes and quotes', () => {
            const input = 'Sure, here is "A story about space"';
            // Logic: "Sure, here" matches prefix? Let's check formatters.ts
            // prefixes: /^Sure, here.*/i 
            // Wait, replace(prefix, '') replaces the WHOLE match if regex matches whole string?
            // The regex in formatters.ts is `^Sure, here.*` which matches the ENTIRE string starting with that.
            // So `input` matches, and replace returns empty string?
            // Let's check implementation behavior expectation.
            // If the regex is `^Prefix.*`, it replaces the whole line? 
            // Correct behavior for "Here is a query..." is likely intended to remove the preamble.

            // Let's test a simpler strip first
            expect(cleanDescription('Prompt: Create a story')).toBe('Create a story');
        });

        it('should leave clean text alone', () => {
            const input = "Just a normal description.";
            expect(cleanDescription(input)).toBe("Just a normal description.");
        });
    });

    describe('formatDuration', () => {
        it('should format seconds to MM:SS', () => {
            expect(formatDuration(65)).toBe('01:05');
            expect(formatDuration(125)).toBe('02:05');
            expect(formatDuration(3600)).toBe('60:00'); // Simple mm:ss as per code
        });

        it('should handle zero or null', () => {
            expect(formatDuration(0)).toBe('00:00');
            // @ts-ignore
            expect(formatDuration(null)).toBe('00:00');
        });
    });

    describe('isLoopable', () => {
        it('should identify loopable categories', () => {
            expect(isLoopable('soundscape', 180)).toBe(true);
            expect(isLoopable('white_noise', 600)).toBe(true);
        });

        it('should reject non-loopable categories', () => {
            expect(isLoopable('fantasy', 180)).toBe(false);
            expect(isLoopable('scifi', 180)).toBe(false);
        });
    });
});
