import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export const maxDuration = 300; // 5 minutes for generation

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

        // 3. Run generation
        const body = await req.json();

        if (!body.title || !body.description || !body.category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const brief = {
            title: body.title,
            description: body.description,
            category: body.category,
            duration: body.duration || 2,
            mood: body.mood || 'peaceful',
            setting: body.setting,
            timeOfDay: body.timeOfDay || 'night',
            sensoryFocus: body.sensoryFocus || 'neutral',
            perspective: body.perspective || 'second_person',
            language: body.language || 'English',
            voiceSettings: body.voiceSettings,
            systemPrompt: body.systemPrompt,
            voiceId: body.voiceId,
            voiceStyle: body.voiceStyle,
            musicFile: body.musicFile,
            pacingStyle: body.pacingStyle || 'slow',
            wordsPerMinute: body.wordsPerMinute,
            pauseCount: body.pauseCount
        };

        const base64Str = Buffer.from(JSON.stringify(brief)).toString('base64');
        const toolsDir = path.resolve(process.cwd(), 'tools/audio-factory');

        console.log('🏭 Triggering Audio Factory...', { title: brief.title });

        const command = `npx tsx src/index.ts custom "${base64Str}"`;

        const { stdout, stderr } = await execPromise(command, {
            cwd: toolsDir,
            env: {
                ...process.env,
                PATH: process.env.PATH,
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY
            }
        });

        console.log('✅ Factory Output:', stdout);
        if (stderr) console.error('⚠️ Factory Stderr:', stderr);

        const systemPromptMatch = stdout.match(/\[DEBUG-PROMPT-SYSTEM-START\]([\s\S]*?)\[DEBUG-PROMPT-SYSTEM-END\]/);
        const userPromptMatch = stdout.match(/\[DEBUG-PROMPT-USER-START\]([\s\S]*?)\[DEBUG-PROMPT-USER-END\]/);

        const usageMatch = stdout.match(/\[DEBUG-USAGE-START\]([\s\S]*?)\[DEBUG-USAGE-END\]/);
        let usageData = null;
        if (usageMatch) {
            try {
                usageData = JSON.parse(usageMatch[1]);
            } catch {
                console.warn('Failed to parse usage JSON');
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Story generated and uploaded successfully',
            output: stdout,
            prompts: {
                system: systemPromptMatch ? systemPromptMatch[1].trim() : 'Prompt not captured',
                user: userPromptMatch ? userPromptMatch[1].trim() : 'Prompt not captured'
            },
            usage: usageData
        });

    } catch (error: unknown) {
        console.error('❌ Factory API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const stderr = (error as { stderr?: string })?.stderr;
        return NextResponse.json(
            { error: message, details: stderr },
            { status: 500 }
        );
    }
}
