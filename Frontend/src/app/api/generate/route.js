import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const examType = formData.get("examType");
    const subject = formData.get("subject");
    const imageBase64 = formData.get("file");

    if (!examType || !subject || !imageBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/rag/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examType,
        subject,
        ImageBase64String: imageBase64,
        topK: 8,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in generate API route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
