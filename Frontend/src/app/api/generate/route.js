"use server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const examType = formData.get("examType");
    const subject = formData.get("subject");
    const imageBase64 = formData.get("file"); // This is a File object

    if (!examType || !subject || !imageBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    console.log("Backend URL:", BACKEND_URL);

    // Step 1: Call /Text_extract to extract text from image
    const extractResponse = await fetch(`${BACKEND_URL}/Text_extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ImageBase64String: imageBase64, Subject: getSubjectCode(examType, subject) })
    });

    if (!extractResponse.ok) {
      return NextResponse.json({ error: "Failed to extract text" }, { status: 500 });
    }

    const extractedText = await extractResponse.json();
    if (!extractedText) {
      return NextResponse.json({ error: "No text extracted" }, { status: 500 });
    }

    // Step 2: Process the extracted text
    const questions = extractedText;

    // Return the extracted text as the response
    return NextResponse.json({ questions: questions.suggestions, status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// Map exam type and subject to the respective backend API endpoint
function getSubjectApi(examType, subject) {
  const apiMap = {
    jee: {
      physics: "Jee_Physics",
      chemistry: "Jee_Chemistry",
      mathematics: "Jee_Maths"
    },
    neet: {
      physics: "NEET_phy",
      chemistry: "NEET_chem",
      biology: "NEET_bio"
    }
  };
  return apiMap[examType]?.[subject] || null;
}

// Map subjects to the format used in /Text_extract
function getSubjectCode(examType, subject) {
  const subjectCodeMap = {
    jee: {
      physics: "Jp",
      chemistry: "Jc",
      mathematics: "Jm"
    },
    neet: {
      physics: "Np",
      chemistry: "Nc",
      biology: "Nb"
    }
  };
  return subjectCodeMap[examType]?.[subject] || "";
}
