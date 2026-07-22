import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/rag/dashboard-metrics`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics." }, { status: 500 });
  }
}
