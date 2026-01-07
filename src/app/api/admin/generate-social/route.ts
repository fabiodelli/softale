import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { storyId } = await req.json();

        if (!storyId) {
            return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
        }

        // Path to the social-bot script
        // We assume we are in <project>/src/app/api/... so we go up to root
        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'tools', 'social-bot', 'src', 'index.ts');

        console.log(`🚀 Triggering Social Bot for ${storyId}...`);

        // Spawn the process
        // Windows compatibility: use 'cmd' with /c npx or just npx if in path (spawn handles it usually if using shell:true)
        const child = spawn('npx', ['tsx', scriptPath, storyId], {
            cwd: projectRoot,
            shell: true,
            stdio: 'ignore' // Fire and forget, don't pipe output to parent to avoid potential hangs
        });

        child.unref(); // Allow parent to exit independently, and don't wait

        return NextResponse.json({
            success: true,
            message: 'Social generation started in background. Check Social Studio in 1-2 minutes.'
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
