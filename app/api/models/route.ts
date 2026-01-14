import { NextResponse } from 'next/server';
import ollama from 'ollama';

export async function GET() {
    try {
        const list = await ollama.list();
        return NextResponse.json(list);
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: 'Failed to fetch models. Make sure Ollama is running.' },
            { status: 500 }
        );
    }
}
