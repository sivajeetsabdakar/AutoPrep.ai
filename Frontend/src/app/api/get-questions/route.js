"use server"
import {  NextResponse } from "next/server";
export async function GET(req) {
    console.log("GET /api/get-questions")
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get('examType');
    if (req.method !== 'GET') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    if (!examType || (examType !== 'jee' && examType !== 'neet')) {
        return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 });
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    try {
        const response = await fetch((`${backendUrl}/get-questions?examType=${examType}`), {
            method: 'GET',
        });
        return NextResponse.json(await response.json(), { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch questions from backend' }, { status: 500 });
    }
}
