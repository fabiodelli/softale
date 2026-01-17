import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service Role Client
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

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // 1. Verify Caller Identity
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { }
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Caller Role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 3. Perform Deletion
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion via this route (optional safety)
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself via admin API' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Delete API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
