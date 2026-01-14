
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

export const maxDuration = 120; // 2 minutes for concept generation

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.idea || !body.category) {
            return NextResponse.json(
                { error: 'Missing idea or category' },
                { status: 400 }
            );
        }

        const toolsDir = path.resolve(process.cwd(), 'tools/audio-factory');

        // Sanitize Clean Category (for safe ARG, though redundant if we use options, kept for CLI usage clarity)
        const cleanCategory = body.category.replace(/[^a-zA-Z0-9_]/g, '');
        const cleanIdea = body.idea.replace(/"/g, '\\"'); // Escape quotes for shell arg

        // Bundle V5 Options
        const options = {
            duration: body.duration || 10,
            mixLevel: body.mixLevel || 0.25,
            title: body.title, // V5
            pacingMode: body.pacingMode, // V5
            warmupDuration: body.warmupDuration, // V5
            ambiencePrompt: body.ambiencePrompt // V5
        };

        // Base64 Encode Options safely for CLI
        const optionsBase64 = Buffer.from(JSON.stringify(options)).toString('base64');

        console.log(`🧠 Generating Concept: "${body.idea}" [${cleanCategory}, V5 Options Encoded]`);

        // Execute CLI: npx tsx src/index.ts concept <category> <idea> <base64Options>
        const command = `npx tsx src/index.ts concept ${cleanCategory} "${cleanIdea}" ${optionsBase64}`;

        const { stdout, stderr } = await execPromise(command, {
            cwd: toolsDir,
            env: { ...process.env }
        });

        console.log('✅ CLI Output:', stdout);

        // Parse logic: Find the "Concept Saved: path/to/file.json" line
        // We look for the "Concept Saved:" prefix and capture everything after it until end of line
        const match = stdout.match(/Concept Saved:\s*(.*\.json)/);

        if (!match || !match[1]) {
            throw new Error('Failed to find output file path in CLI output');
        }

        // Clean the path: remove ANSI color codes (if any) and whitespace
        // \u001b\[[0-9;]*m regex removes standard ANSI escape codes
        let filePath = match[1].replace(/\u001b\[[0-9;]*m/g, '').trim();

        if (!fs.existsSync(filePath)) {
            throw new Error(`Generated file not found at: ${filePath}`);
        }

        // Read the generated JSON to return to frontend
        const conceptData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        return NextResponse.json({
            success: true,
            concept: conceptData,
            filePath: filePath
        });

    } catch (error: any) {
        console.error('❌ Concept API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
