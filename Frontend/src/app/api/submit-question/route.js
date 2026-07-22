import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const formData = await req.formData();
  const imageBase64 = formData.get("imageBase64");
  const size = Number(formData.get("size") || 0);

  if (!imageBase64) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }
  if (size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 413 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl}/rag/submit-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          provider: "google",
        },
      }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in submit-question API route:", error);
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }
}
