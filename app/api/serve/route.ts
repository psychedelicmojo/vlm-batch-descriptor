import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
// import mime from 'mime'; // Removed to avoid dependency

// Basic mime map if no package
const getMimeType = (ext: string) => {
    const map: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff',
    };
    return map[ext.toLowerCase()] || 'application/octet-stream';
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath || !fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = getMimeType(ext);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600'
            },
        });
    } catch (error) {
        return new NextResponse('Error reading file', { status: 500 });
    }
}
