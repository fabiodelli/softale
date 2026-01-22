import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                waitlist_joined_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Waitlist update error:', error);
            return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
        }

        // Optional: Send email notification to admin (not implemented yet, but placeholders here)
        // await sendAdminNotification(userId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Waitlist API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
