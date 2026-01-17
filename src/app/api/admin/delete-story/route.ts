import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with service role for admin operations
// This bypasses RLS policies
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
        const { storyId } = await request.json();

        if (!storyId) {
            return NextResponse.json({ error: 'Story ID required' }, { status: 400 });
        }

        // Delete all related records first (cascade delete)
        // Delete from favorites
        const { error: favError } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('story_id', storyId);

        if (favError) {
            console.error('Error deleting favorites:', favError);
        }

        // Delete from user_progress
        const { error: progressError } = await supabaseAdmin
            .from('user_progress')
            .delete()
            .eq('story_id', storyId);

        if (progressError) {
            console.error('Error deleting progress:', progressError);
        }

        // Delete from collection_stories
        const { error: collError } = await supabaseAdmin
            .from('collection_stories')
            .delete()
            .eq('story_id', storyId);

        if (collError) {
            console.error('Error deleting collection_stories:', collError);
        }

        // Now delete the story itself
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
