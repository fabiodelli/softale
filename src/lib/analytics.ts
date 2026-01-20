import { supabase } from './supabase';

export type EventName = 'mood_select' | 'story_play' | 'story_complete' | 'story_like' | 'story_unlike' | 'collection_view';

export interface AnalyticsMetadata {
    [key: string]: any;
}

/**
 * Fire-and-forget event tracking.
 * We don't await this usually to avoid blocking UI.
 */
export const trackEvent = async (eventName: EventName, metadata: AnalyticsMetadata = {}) => {
    if (!supabase) return;

    // GDPR/Privacy Check
    if (typeof window !== 'undefined') {
        const consent = localStorage.getItem('softale-cookie-consent');
        // Only track if explicitly accepted
        if (consent !== 'accepted') {
            return;
        }
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Session ID could be generated / stored in localStorage for anonymous users
        // For now we just track logged in users or null

        // We assume 'public.analytics_events' exists and RLS allows insert
        await supabase.from('analytics_events').insert({
            user_id: userId,
            event_name: eventName,
            metadata
        });

    } catch (err) {
        console.warn('Analytics Error:', err);
    }
};
