import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Service Role Client (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verify caller identity
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() { }
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify admin role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 3. Perform cascade delete
        const { storyId } = await request.json();

        if (!storyId) {
            return NextResponse.json({ error: 'Story ID required' }, { status: 400 });
        }

        // Delete related records before the story itself
        const { error: favError } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('story_id', storyId);
        if (favError) console.error('Error deleting favorites:', favError);

        const { error: progressError } = await supabaseAdmin
            .from('user_progress')
            .delete()
            .eq('story_id', storyId);
        if (progressError) console.error('Error deleting progress:', progressError);

        const { error: playlistError } = await supabaseAdmin
            .from('playlist_items')
            .delete()
            .eq('story_id', storyId);
        if (playlistError) console.error('Error deleting playlist_items:', playlistError);

        const { error: collError } = await supabaseAdmin
            .from('collection_stories')
            .delete()
            .eq('story_id', storyId);
        if (collError) console.error('Error deleting collection_stories:', collError);

        // Delete the story
        const { error: storyError } = await supabaseAdmin
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (storyError) {
            return NextResponse.json({
                error: storyError.message || 'Failed to delete story'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete story API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
