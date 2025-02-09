"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Lightbulb, Trophy } from "lucide-react"

export default function QuestionMe() {
  const [examType, setExamType] = useState("")
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [solutions, setSolutions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  const [showHints, setShowHints] = useState({})
  const [showCorrectAnswers, setShowCorrectAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchQuestions = async () => {
    if (examType && started) {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/get-questions?examType=${examType}`)
        const data = await response.json()
        console.log("Questions:", data)
        setQuestions(data.questions) // Store images
        setSolutions(data.solutions) // Store solutions
      } catch (error) {
        console.error("Error fetching questions:", error)
        setError("Failed to fetch questions. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [examType, started])

  const handleStart = () => setStarted(true)

  const handleSubmit = (index) => {
    const isCorrect = selectedAnswers[index]?.trim() === solutions[index]
    console.log(`Question ${index + 1} is ${isCorrect ? "correct" : "incorrect"}`)
    setSubmittedAnswers(prev => ({ ...prev, [index]: selectedAnswers[index] }))
  }

  const toggleHint = (index) => {
    setShowHints(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const toggleShowAnswer = (index) => {
    setShowCorrectAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto px-2 md:px-4">
          {!started ? (
            <Card>
              <CardHeader>
                <CardTitle>Question Me</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium">Select Your Exam</label>
                  <div className="flex space-x-4">
                    <Button onClick={() => setExamType("jee")} variant={examType === "jee" ? "default" : "outline"}>
                      JEE
                    </Button>
                    <Button onClick={() => setExamType("neet")} variant={examType === "neet" ? "default" : "outline"}>
                      NEET
                    </Button>
                  </div>
                </div>
                <Button onClick={handleStart} disabled={!examType} className={`w-full bg-accent hover:bg-accent-dark`}>
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {questions.map((question, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{`Question ${index + 1}`}</CardTitle>
                          <div className="flex items-center text-accent">
                            <Trophy className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">10 pts</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Render Image */}
                        <img src={question} alt={`Question ${index + 1}`} className="w-full max-h-32 object-contain" />
                                    
                        {/* Check if Solution is Numeric (Integer-based Answer) */}
                        {solutions[index].startsWith("I") ? (
                          <>
                            <Input
                              type="number"
                              placeholder="Enter your answer"
                              onChange={(e) =>
                                setSelectedAnswers({ ...selectedAnswers, [index]: e.target.value })
                              }
                              className={`border-2 ${
                                submittedAnswers[index] !== undefined
                                  ? submittedAnswers[index] == solutions[index].substring(1)
                                    ? "border-green-500"
                                    : "border-red-500"
                                  : ""
                              }`}
                            />
                            <Button
                              onClick={() => {
                                setSubmittedAnswers({ ...submittedAnswers, [index]: selectedAnswers[index] });
                              }}
                              className={`w-full bg-accent hover:bg-accent-dark`}
                            >
                              Submit Answer
                            </Button>
                            {submittedAnswers[index] !== undefined &&
                              submittedAnswers[index] != solutions[index].substring(1) && (
                                <Button variant="outline" onClick={() => toggleShowAnswer(index)} className="mr-2">
                                  Show Answer
                                </Button>
                              )}
                            {showCorrectAnswers[index] && (
                              <p className="text-green-500">
                                Correct Answer: {solutions[index].substring(1)}
                              </p>
                            )}
                          </>
                        ) : (
                          // Multiple Choice
                          [1, 2, 3, 4].map((option) => {
                            const isSelected = selectedAnswers[index] === option.toString()
                            const isCorrect = isSelected && selectedAnswers[index] === solutions[index]
                            return (
                              <Button
                                key={option}
                                className={`my-1 w-full ${
                                  isSelected ? (isCorrect ? "bg-green-500 hover:bg-green-500" : "bg-red-500 hover:bg-red-500") : ""
                                }`}
                                onClick={() => setSelectedAnswers({ ...selectedAnswers, [index]: option.toString() })}
                                variant="outline"
                              >
                                ({option})
                              </Button>
                            )
                          })
                        )}

                        {/* Hint & Submit */}
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => toggleHint(index)}>
                            <Lightbulb className="mr-2 h-4 w-4" />
                            {showHints[index] ? "Hide Hint" : "Show Hint"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
