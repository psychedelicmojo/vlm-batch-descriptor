import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { folderPath } = await request.json();

        if (!folderPath || !fs.existsSync(folderPath)) {
            console.error(`Scan failed. Path not found: '${folderPath}'`);
            return NextResponse.json(
                { error: `Invalid or non-existent path: '${folderPath}'` },
                { status: 400 } // status: 400
            );
        }

        const files = fs.readdirSync(folderPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff'];

        // Filter for images and get full paths
        const images = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .map(file => path.join(folderPath, file));

        return NextResponse.json({ images });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Scan failed' },
            { status: 500 }
        );
    }
}
