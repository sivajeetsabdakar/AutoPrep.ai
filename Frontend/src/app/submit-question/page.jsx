"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function SubmitQuestion() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [preview, setPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    setResult(null);
    setFile(null);
    setImageBase64("");
    setPreview("");

    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const value = String(reader.result || "");
      setFile(selected);
      setImageBase64(value);
      setPreview(value);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async () => {
    if (!file || !imageBase64) {
      setError("Choose an image first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("imageBase64", imageBase64);
      formData.append("size", String(file.size));

      const response = await fetch("/api/submit-question", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok && !data.validation) {
        throw new Error(data.error || "Failed to submit question.");
      }
      setResult(data);
    } catch (error) {
      setError(error.message || "Failed to submit question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 text-center text-muted-foreground">Checking sign-in...</div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="p-8 max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5 text-accent" />
                Sign In Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sign in with Google to submit JEE/NEET question images for AI validation.
              </p>
              <Button className="w-full bg-accent hover:bg-accent-dark" onClick={() => signIn("google", { callbackUrl: "/submit-question" })}>
                Continue with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Question Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                Signed in as {session.user.email}
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Upload one image containing the question and answer</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, JPEG, or WEBP up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    id="question-submission-upload"
                    onChange={handleFileChange}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="question-submission-upload" className="cursor-pointer">
                      Choose Image
                    </label>
                  </Button>
                </div>
              </div>

              {preview && (
                <div className="rounded-md border p-3">
                  <img src={preview} alt="Question submission preview" className="max-h-[360px] w-full object-contain" />
                </div>
              )}

              <Button
                className="w-full bg-accent hover:bg-accent-dark"
                disabled={!file || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Validating with Gemini..." : "Submit for Validation"}
              </Button>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result ? (
                <p className="text-muted-foreground">Gemini will extract the exam, subject, question text, and answer before storing it.</p>
              ) : result.accepted ? (
                <StatusBlock accepted result={result} />
              ) : (
                <StatusBlock result={result} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatusBlock({ accepted = false, result }) {
  const validation = result.validation || {};

  return (
    <div className="space-y-4">
      <div className={`flex items-center rounded-md border p-4 ${accepted ? "text-green-600" : "text-red-600"}`}>
        {accepted ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
        <span className="font-medium">{accepted ? "Accepted into the RAG question bank" : "Rejected"}</span>
      </div>

      {!accepted && result.rejectionReason && (
        <p className="rounded-md bg-muted p-3 text-sm">{result.rejectionReason}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Exam" value={validation.exam_type?.toUpperCase()} />
        <Info label="Subject" value={validation.subject} />
        <Info label="Chapter" value={validation.chapter} />
        <Info label="Confidence" value={validation.confidence !== undefined ? `${Math.round(validation.confidence * 100)}%` : ""} />
      </div>

      {validation.question_text && (
        <div>
          <p className="text-sm font-medium">Question</p>
          <p className="mt-1 whitespace-pre-line rounded-md border p-3 text-sm text-muted-foreground">{validation.question_text}</p>
        </div>
      )}

      {validation.answer && (
        <div>
          <p className="text-sm font-medium">Answer</p>
          <p className="mt-1 whitespace-pre-line rounded-md border p-3 text-sm text-muted-foreground">{validation.answer}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value || "Not detected"}</p>
    </div>
  );
}
