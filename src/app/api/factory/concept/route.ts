import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

export const maxDuration = 120; // 2 minutes for concept generation

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

export async function POST(req: NextRequest) {
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

        // 3. Run concept generation
        const body = await req.json();

        if (!body.idea || !body.category) {
            return NextResponse.json(
                { error: 'Missing idea or category' },
                { status: 400 }
            );
        }

        const toolsDir = path.resolve(process.cwd(), 'tools/audio-factory');

        const cleanCategory = body.category.replace(/[^a-zA-Z0-9_]/g, '');
        const cleanIdea = body.idea.replace(/"/g, '\\"');

        const options = {
            duration: body.duration || 10,
            mixLevel: body.mixLevel || 0.25,
            title: body.title,
            pacingMode: body.pacingMode,
            warmupDuration: body.warmupDuration,
            ambiencePrompt: body.ambiencePrompt,
            mixSettings: body.mixSettings,
            layers: body.layers,
            generationMode: body.generationMode
        };

        const optionsBase64 = Buffer.from(JSON.stringify(options)).toString('base64');

        console.log(`🧠 Generating Concept: "${body.idea}" [${cleanCategory}]`);

        const command = `npx tsx src/index.ts concept ${cleanCategory} "${cleanIdea}" ${optionsBase64}`;

        const { stdout } = await execPromise(command, {
            cwd: toolsDir,
            env: { ...process.env }
        });

        console.log('✅ CLI Output:', stdout);

        const match = stdout.match(/Concept Saved:\s*(.*\.json)/);

        if (!match || !match[1]) {
            throw new Error('Failed to find output file path in CLI output');
        }

        let filePath = match[1].replace(/\[[0-9;]*m/g, '').trim();

        if (!fs.existsSync(filePath)) {
            throw new Error(`Generated file not found at: ${filePath}`);
        }

        const conceptData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        return NextResponse.json({
            success: true,
            concept: conceptData,
            filePath: filePath
        });

    } catch (error: unknown) {
        console.error('❌ Concept API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
