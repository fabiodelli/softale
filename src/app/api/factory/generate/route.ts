
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export const maxDuration = 300; // Allow 5 minutes for generation

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.title || !body.description || !body.category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Construct Brief object matching CLI expectation
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
            voiceStyle: body.voiceStyle, // Pass voice style to Factory
            musicFile: body.musicFile,
            pacingStyle: body.pacingStyle || 'slow',
            wordsPerMinute: body.wordsPerMinute,
            pauseCount: body.pauseCount
        };

        // Encode as Base64 JSON
        const jsonStr = JSON.stringify(brief);
        const base64Str = Buffer.from(jsonStr).toString('base64');

        // Path to CLI
        // Note: In dev mode, we point to the source. In prod, this might differ.
        const toolsDir = path.resolve(process.cwd(), 'tools/audio-factory');

        console.log('🏭 Triggering Audio Factory...', { title: brief.title });
        console.log('🔑 Debug Environment:', {
            hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
            anthropicPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 7) + '...' : 'MISSING',
            hasEleven: !!process.env.ELEVENLABS_API_KEY,
            hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });

        // Execute CLI command
        // We use 'npx tsx src/index.ts custom ...' explicitly
        const command = `npx tsx src/index.ts custom "${base64Str}"`;

        // Note: This waits for completion. For long tasks, we might want to fire-and-forget 
        // or use a queue, but for this prototype, we'll wait (hence maxDuration).
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

        // Parse Prompts from Stdout
        const systemPromptMatch = stdout.match(/\[DEBUG-PROMPT-SYSTEM-START\]([\s\S]*?)\[DEBUG-PROMPT-SYSTEM-END\]/);
        const userPromptMatch = stdout.match(/\[DEBUG-PROMPT-USER-START\]([\s\S]*?)\[DEBUG-PROMPT-USER-END\]/);

        // Parse Usage from Stdout
        const usageMatch = stdout.match(/\[DEBUG-USAGE-START\]([\s\S]*?)\[DEBUG-USAGE-END\]/);
        let usageData = null;
        if (usageMatch) {
            try {
                usageData = JSON.parse(usageMatch[1]);
            } catch (e) {
                console.warn('Failed to parse usage JSON');
            }
        }

        const parsedPrompts = {
            system: systemPromptMatch ? systemPromptMatch[1].trim() : 'Prompt not captured',
            user: userPromptMatch ? userPromptMatch[1].trim() : 'Prompt not captured'
        };

        return NextResponse.json({
            success: true,
            message: 'Story generated and uploaded successfully',
            output: stdout,
            prompts: parsedPrompts,
            usage: usageData
        });

    } catch (error: unknown) {
        console.error('❌ Factory API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const stderr = (error as { stderr?: string })?.stderr;
        return NextResponse.json(
            {
                error: message,
                details: stderr,
                debugEnv: {
                    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
                    anthropicPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 7) + '...' : 'MISSING',
                    hasEleven: !!process.env.ELEVENLABS_API_KEY,
                    hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY
                }
            },
            { status: 500 }
        );
    }
}
