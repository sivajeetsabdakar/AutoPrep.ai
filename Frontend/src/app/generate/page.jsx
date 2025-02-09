"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Lightbulb } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Generate() {
  const [examType, setExamType] = useState("")
  const [subject, setSubject] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState(null)
  const [file, setFile] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showHints, setShowHints] = useState({})
  const [showCorrectAnswers, setShowCorrectAnswers] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  const toggleShowAnswer = (index) => {
    setShowCorrectAnswers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  };

  const handleFileUpload = (event) => {
    if (event.target.files.length > 0) {
      const selectedFile = event.target.files[0]
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onloadend = () => {
        setFile(reader.result.split(",")[1]) // Extract Base64 string
      }
    }
  }

  const handleGenerate = async () => {
    if (!file) return alert("Please upload an image file.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("examType", examType);
    formData.append("subject", subject);
    formData.append("file", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to generate questions");
      const data = await response.json();
      setGeneratedQuestions(data.questions); // Assuming the response contains the questions in suggestions
      console.log("Generated questions:", data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("Request timed out");
      } else {
        console.error("Error generating questions:", error);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const toggleHint = (index) => {
    setShowHints((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmit = (index) => {
    // Handle answer submission logic here
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="py-8 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto">
          <Card className="md:mx-4 md:my-4 mx-2 my-2">
            <CardHeader>
              <CardTitle>Generate Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 md:p-6 p-4">
              <div className="space-y-4">
                <Label>Select Exam Type</Label>
                <RadioGroup onValueChange={setExamType} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jee" id="jee" className="text-accent" />
                    <Label htmlFor="jee">JEE</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neet" id="neet" className="text-accent" />
                    <Label htmlFor="neet">NEET</Label>
                  </div>
                </RadioGroup>
              </div>

              {examType && (
                <div className="space-y-4">
                  <Label>Select Subject</Label>
                  <Select onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      {examType === "jee" && (
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                      )}
                      {examType === "neet" && (
                        <SelectItem value="biology">Biology</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {subject && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drop your image here or click to upload</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG, or JPEG (max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden text-accent"
                      id="image-upload"
                      onChange={handleFileUpload}
                    />
                    <Button asChild className="bg-accent hover:bg-accent-dark">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        Select Image
                      </label>
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className={`w-full bg-accent hover:bg-accent-dark`}
                onClick={handleGenerate}
                disabled={!examType || !subject || !file || isLoading}
              >
                {isLoading ? "Generating..." : "Generate Questions"}
              </Button>
            </CardContent>
          </Card>

          {/* Right Side - Generated Questions with Custom Scrollbar */}
          <ScrollArea className="h-[80vh] overflow-y-auto thin-scrollbar">
            <Card className="md:mx-4 md:my-4 mx-2 my-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Generated Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm md:text-base md:p-6 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : generatedQuestions && generatedQuestions.length > 0 ? (
                  generatedQuestions.map((question, index) => (
                    <Card key={index} className="md:mx-4 md:my-4 my-2">
                      <CardHeader>
                        <CardTitle>{`Question ${index + 1}`}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 md:p-6 p-2">
                        <img src={question.image} alt={`Question ${index + 1}`} className="w-full h-auto" />
                        <p>{question.text}</p>
                        {question.ans.startsWith("I") ? (
                          <>
                            <Input
                              type="number"
                              placeholder="Enter your answer"
                              onChange={(e) =>
                                setSelectedAnswers({ ...selectedAnswers, [index]: e.target.value })
                              }
                              className={`border-2 ${submittedAnswers[index] !== undefined
                                  ? submittedAnswers[index] == question.ans.substring(1)
                                    ? "border-green-500"
                                    : "border-red-500"
                                  : ""
                                }`}
                            />
                            <Button
                              onClick={() => {
                                setSubmittedAnswers({ ...submittedAnswers, [index]: selectedAnswers[index] });
                              }}
                              className="mr-2"
                            >
                              Submit Answer
                            </Button>
                            {submittedAnswers[index] !== undefined &&
                              submittedAnswers[index] != question.ans.substring(1) && (
                                <Button variant="outline" onClick={() => toggleShowAnswer(index)}
                                className="mr-2">
                                  Show Answer
                                </Button>
                              )}
                            {showCorrectAnswers[index] && (
                              <p className="text-green-500">
                                Correct Answer: {question.ans.substring(1)}
                              </p>
                            )}
                          </>
                        ) : (
                          [1, 2, 3, 4].slice(0, 4).map((option, optIndex) => {
                            const isSelected = selectedAnswers[index]?.option === (optIndex + 1).toString();
                            const isCorrect = isSelected && selectedAnswers[index]?.option === question.ans.toString();
                            const handleAnswerClick = (qIndex, option) => {
                              setSelectedAnswers({ ...selectedAnswers, [qIndex]: { option } });
                            };
                            return (
                              <Button
                                key={optIndex}
                                className={`my-1 w-full ${isSelected ? (isCorrect ? "bg-green-500 hover:bg-green-500" : "bg-red-500 hover:bg-red-500") : ""
                                  }`}
                                onClick={() => handleAnswerClick(index, (optIndex + 1).toString())}
                                variant="outline"
                              >
                                ({option})
                              </Button>
                            );
                          })
                        )}
                        <Button variant="outline" onClick={() => toggleHint(index)}>Show Hint</Button>
                        {showHints[index] && <p className="text-blue-500">Hint: {question.hint}</p>}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8">Upload an image to see AI-generated questions</p>
                )}
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    </main>
  )
}
