import { NextResponse, NextRequest } from 'next/server';
import ollama from 'ollama';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const MAX_DESCRIPTION_LENGTH = 8000;
const EXIFTOOL_TIMEOUT = 8000;

export async function POST(request: NextRequest) {
    try {
        const { filePath, model } = await request.json();

        if (!filePath || !model) {
            return NextResponse.json(
                { error: 'Missing filePath or model' },
                { status: 400 }
            );
        }

        // File validation
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'FILE_NOT_FOUND', details: `File does not exist: ${filePath}` },
                { status: 404 }
            );
        }

        try {
            fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch (err) {
            return NextResponse.json(
                { error: 'FILE_ACCESS_DENIED', details: 'Cannot read or write to file' },
                { status: 403 }
            );
        }

        // 1. Generate Description with Ollama
        console.log(`[API] sending to ollama: ${filePath}, model: ${model}`);

        const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

        console.log(`[API] ollama generating...`);
        const response = await ollama.generate({
            model: model,
            prompt: "Describe this image in detail.",
            images: [imageBase64],
            stream: false,
        });

        let description = response.response;

        // Handle description length
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            console.warn(`[API] Description truncated from ${description.length} to ${MAX_DESCRIPTION_LENGTH}`);
            description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + '...';
        }

        console.log(`[API] ollama finished. Length: ${description.length}`);

        // 2. Write Metadata with ExifTool (Secure spawn)
        console.log(`[API] Writing metadata via exiftool binary...`);

        const exiftoolBin = path.join(process.cwd(), 'node_modules', 'exiftool-vendored.exe', 'bin', 'exiftool.exe');

        // Use spawnSync with args array - no shell injection possible
        const result = spawnSync(exiftoolBin, [
            '-overwrite_original',
            `-ImageDescription=${description}`,
            `-XPComment=${description}`,
            `-XMP-dc:Description=${description}`,
            filePath
        ], {
            encoding: 'utf-8',
            timeout: EXIFTOOL_TIMEOUT,
            windowsHide: true
        });

        if (result.error) {
            console.error(`[API] ExifTool spawn error:`, result.error);
            return NextResponse.json(
                { error: 'EXIFTOOL_SPAWN_FAILED', details: result.error.message },
                { status: 500 }
            );
        }

        if (result.status !== 0) {
            console.error(`[API] ExifTool failed with code ${result.status}: ${result.stderr}`);
            return NextResponse.json(
                { error: 'EXIFTOOL_WRITE_FAILED', details: result.stderr || 'Unknown error' },
                { status: 500 }
            );
        }

        console.log(`[API] ExifTool SUCCESS: ${result.stdout}`);

        return NextResponse.json({
            success: true,
            description: description,
            truncated: response.response.length > MAX_DESCRIPTION_LENGTH
        });

    } catch (error: any) {
        console.error('Processing error:', error);

        // Specific error types
        if (error.message?.includes('model')) {
            return NextResponse.json(
                { error: 'OLLAMA_MODEL_ERROR', details: error.message },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'PROCESSING_FAILED', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
