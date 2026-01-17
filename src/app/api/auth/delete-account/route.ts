import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover' as any,
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Verify User Session using SSR client
        const supabaseUser = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { }
                }
            }
        );

        const { data: { session } } = await supabaseUser.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Check Subscription Status & Cancel if needed
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();

        if (profile?.subscription_status === 'active' && profile.subscription_id) {
            try {
                await stripe.subscriptions.cancel(profile.subscription_id);
                console.log(`Cancelled subscription ${profile.subscription_id} for deleting user ${userId}`);
            } catch (stripeError: any) {
                console.error("Stripe cancellation failed", stripeError);
                return NextResponse.json({ error: 'Active subscription could not be cancelled. Please contact support.' }, { status: 400 });
            }
        }

        // Delete Auth User (Cascades to Profile)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Delete User Failed:', deleteError);
            return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Account API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
