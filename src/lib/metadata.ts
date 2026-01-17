/**
 * Metadata Utility for Story Categorization using Tags
 * This allows us to extend story metadata (Mood, Duration Type, Voice Gender) 
 * using the existing `tags` array without database schema migrations.
 */

import { Story } from './supabase';

export type DurationType = 'short' | 'medium' | 'long';
export type VoiceGender = 'male' | 'female' | 'ai';
export type StoryMood = 'calm' | 'uplifting' | 'dreamy' | 'focused' | 'mysterious';

export interface StoryMetadata {
    durationType: DurationType;
    voiceGender?: VoiceGender;
    mood?: StoryMood;
}

// Helpers to classify duration
export const getDurationType = (seconds: number): DurationType => {
    if (seconds < 600) return 'short'; // < 10 mins
    if (seconds < 1800) return 'medium'; // 10-30 mins
    return 'long'; // > 30 mins
};

// Helper to extract metadata from tags
// Tags format convention: "voice:male", "mood:calm", "duration:short" (optional override)
export const getStoryMetadata = (story: Story): StoryMetadata => {
    const meta: StoryMetadata = {
        durationType: getDurationType(story.duration),
    };

    if (!story.tags) return meta;

    story.tags.forEach(tag => {
        if (tag.startsWith('voice:')) {
            meta.voiceGender = tag.split(':')[1] as VoiceGender;
        }
        if (tag.startsWith('mood:')) {
            meta.mood = tag.split(':')[1] as StoryMood;
        }
    });

    return meta;
};

// Available filters for UI
export const METADATA_FILTERS = {
    duration: [
        { id: 'short', label: 'Short (< 10m)', icon: '⚡' },
        { id: 'medium', label: 'Medium (10-30m)', icon: '⏱️' },
        { id: 'long', label: 'Long (> 30m)', icon: '💤' },
    ],
    voice: [
        { id: 'male', label: 'Male Voice', icon: '👨' },
        { id: 'female', label: 'Female Voice', icon: '👩' },
    ],
    mood: [
        { id: 'calm', label: 'Calm', icon: '🍃' },
        { id: 'uplifting', label: 'Uplifting', icon: '☀️' },
        { id: 'dreamy', label: 'Dreamy', icon: '☁️' },
        { id: 'focused', label: 'Focused', icon: '🎯' },
    ]
} as const;
