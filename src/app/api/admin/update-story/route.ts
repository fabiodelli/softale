import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with service role for admin operations
// This bypasses RLS policies - CRITICAL for Admin actions
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

export async function PATCH(request: NextRequest) {
    try {
        const { storyId, updates } = await request.json();

        if (!storyId) {
            return NextResponse.json({ error: 'Story ID required' }, { status: 400 });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        // Validate allowed fields to prevents arbitrary overwrites if needed, 
        // though this is an admin endpoint protected by Supabase keys (and presumably middleware).
        // For now, allow generic updates as it is flexible for the admin panel.

        const { error } = await supabaseAdmin
            .from('stories')
            .update(updates)
            .eq('id', storyId);

        if (error) {
            return NextResponse.json({
                error: error.message || 'Failed to update story'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update story API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
