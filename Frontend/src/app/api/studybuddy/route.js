import { NextResponse } from 'next/server';

const API_URL = "https://sad-sutherland-ecstatic.lemme.cloud/api/cca11833-2cbb-4840-a8b6-bf0b9f7137e2";

async function getLemmeBuildResponse(input) {
  const data = { message: input };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData.res.reply; // Access the reply from the response
    } else {
      console.error(`Error: ${response.status}, Response: ${await response.text()}`);
      return `Error: ${response.status}`;
    }
  } catch (error) {
    console.error('Error fetching from LemmeBuild API:', error);
    return 'Error processing the request.';
  }
}

export async function POST(req) {
  try {
    console.log("Request received at API route.")

    const formData = await req.formData()
    const doubt = formData.get("doubt")
    console.log("Doubt received:", doubt)

    if (!doubt) {
      console.error("No doubt provided.")
      return NextResponse.json({ error: "No doubt provided." }, { status: 400 })
    }

    const API_URL = "https://sad-sutherland-ecstatic.lemme.cloud/api/cca11833-2cbb-4840-a8b6-bf0b9f7137e2"

    console.log("Sending request to external API...")
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: doubt }),
    })

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText)
      return NextResponse.json({ error: "External API error." }, { status: response.status })
    }

    const data = await response.json()
    console.log("External API response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    )
  }
}
