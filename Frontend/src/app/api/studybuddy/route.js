import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const doubt = formData.get("doubt");
    const examType = formData.get("examType");
    const subject = formData.get("subject");

    if (!doubt) {
      return NextResponse.json({ error: "No doubt provided." }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/rag/studybuddy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doubt, examType, subject }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in studybuddy API route:", error);
    return NextResponse.json({ error: "Failed to process the request." }, { status: 500 });
  }
}
