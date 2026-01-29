
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

export const maxDuration = 300; // 5 minutes for full build

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.conceptPath) {
            return NextResponse.json(
                { error: 'Missing conceptPath' },
                { status: 400 }
            );
        }

        const toolsDir = path.resolve(process.cwd(), 'tools/audio-factory');

        console.log(`🏗️ Building Story from Concept: "${body.conceptPath}"`);

        // Execute CLI: npx tsx src/index.ts build <conceptPath>
        const relativePath = path.relative(toolsDir, body.conceptPath);
        const command = `npx tsx src/index.ts build "${relativePath}"`;

        const { stdout, stderr } = await execPromise(command, {
            cwd: toolsDir,
            env: {
                ...process.env,
                PATH: process.env.PATH,
                USE_LOCAL_TTS: 'true', // Force Qwen TTS
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                STABILITY_API_KEY: process.env.STABILITY_API_KEY
            },
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        console.log('✅ CLI Build Output:', stdout);
        if (stderr) console.error('⚠️ CLI Build Stderr:', stderr);

        // Clean ANSI codes
        const cleanStdout = stdout.replace(/\u001b\[[0-9;]*m/g, '');

        // Parse: Find "Story Complete! ID: xxx" or "Story Uploaded: xxx"
        const match = cleanStdout.match(/(?:Story Complete! ID:|Story Uploaded:)\s*([a-z0-9-]+)/i);

        if (!match || !match[1]) {
            throw new Error(`Failed to find Story ID.\nStdout: ${stdout}\nStderr: ${stderr}`);
        }

        const storyId = match[1].trim();

        return NextResponse.json({
            success: true,
            storyId: storyId,
            logs: cleanStdout
        });

    } catch (error: unknown) {
        console.error('❌ Build API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const stdout = (error as { stdout?: string })?.stdout || '';
        return NextResponse.json(
            { error: message, logs: stdout },
            { status: 500 }
        );
    }
}
