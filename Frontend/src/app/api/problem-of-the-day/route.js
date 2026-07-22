import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") || "jee";
    const response = await fetch(`${backendUrl}/rag/problem-of-the-day?examType=${encodeURIComponent(examType)}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching problem of the day:", error);
    return NextResponse.json({ error: "Failed to fetch problem of the day." }, { status: 500 });
  }
}
