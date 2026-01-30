/**
 * Supabase Profiles Helpers
 * User profile management and statistics
 */

import { User } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './client';
import type { UserProfile } from './types';

// ========================================
// Profile Read/Create
// ========================================

export async function getProfile(userId: string, accessToken?: string): Promise<UserProfile | null> {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return null;

        const headers: Record<string, string> = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken || supabaseAnonKey}`
        };

        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            headers
        });

        if (!res.ok) {
            console.error('Profile fetch error:', res.statusText);
            return null;
        }

        const data = await res.json();
        return data?.[0] || null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function createProfile(user: User): Promise<UserProfile | null> {
    if (!supabase) return null;

    const newProfile = {
        id: user.id,
        email: user.email!,
        username: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
        role: 'user'
    };

    const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        return null;
    }
    return data;
}

// ========================================
// Profile Stats
// ========================================

export async function updateProfileStats(userId: string, updates: {
    total_minutes_listened?: number;
    stories_completed?: number;
    current_streak?: number;
    last_active_date?: string;
}): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile stats:', error);
    }
}

export async function incrementListeningTime(userId: string, minutes: number) {
    if (!supabase) return;
    const { data: profile } = await supabase.from('profiles').select('total_minutes_listened').eq('id', userId).single();
    const current = profile?.total_minutes_listened || 0;
    await updateProfileStats(userId, { total_minutes_listened: current + minutes });
}

export async function checkAndIncrementStreak(userId: string) {
    if (!supabase) return;
    const { data: profile } = await supabase.from('profiles').select('current_streak, last_active_date').eq('id', userId).single();
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active_date;

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastActive === yesterdayStr) {
        newStreak = (profile.current_streak || 0) + 1;
    }

    await updateProfileStats(userId, {
        current_streak: newStreak,
        last_active_date: today
    });
}

export async function incrementStoriesCompleted(userId: string) {
    if (!supabase) return;
    const { data: profile } = await supabase.from('profiles').select('stories_completed').eq('id', userId).single();
    const current = profile?.stories_completed || 0;
    await updateProfileStats(userId, { stories_completed: current + 1 });
}

// ========================================
// Admin Functions
// ========================================

export async function getAllProfiles(): Promise<UserProfile[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
    }
    return data || [];
}

export async function updateUserStatus(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating user:', error);
        return false;
    }
    return true;
}

export async function deleteProfile(userId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('Error deleting profile:', error);
        return false;
    }
    return true;
}
