"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Brain, Trophy, Lightbulb } from "lucide-react"

export default function QuestionMe() {
  const [examType, setExamType] = useState("")
  const [started, setStarted] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showHints, setShowHints] = useState({})

  const questions = [
    {
      subject: "Physics",
      question: "A particle moves in a circular path of radius 2m. If it completes one revolution in 4 seconds, what is its angular velocity?",
      options: ["π/2 rad/s", "π rad/s", "2π rad/s", "4π rad/s"],
      correct: 0,
      points: 100,
      hint: "Hint: Use the formula for angular velocity ω = 2π/T."
    },
    {
      subject: "Chemistry",
      question: "Which quantum number determines the orientation of an orbital?",
      options: ["Principal", "Azimuthal", "Magnetic", "Spin"],
      correct: 2,
      points: 150,
      hint: "Hint: The magnetic quantum number (m) determines the orientation."
    },
    {
      subject: "Mathematics",
      question: "If f(x) = x² + 2x + 1, what is f'(x)?",
      options: ["x + 2", "2x + 2", "x + 1", "2x + 1"],
      correct: 1,
      points: 125,
      hint: "Hint: Use the power rule for differentiation."
    }
  ]

  const handleStart = () => {
    setStarted(true)
  }

  const handleSubmit = (index) => {
    const question = questions[index]
    const isCorrect = selectedAnswers[index] === question.correct
    console.log(`Question ${index + 1} is ${isCorrect ? "correct" : "incorrect"}`)
  }

  const toggleHint = (index) => {
    setShowHints(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {!started ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-6 w-6 text-accent" />
                  Question Me
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Select Your Exam</Label>
                  <RadioGroup
                    onValueChange={(value) => setExamType(value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="jee" id="jee" className="text-accent" />
                      <Label htmlFor="jee">JEE</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="neet" id="neet" className="text-accent"/>
                      <Label htmlFor="neet">NEET</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button
                  onClick={handleStart}
                  disabled={!examType}
                  className="w-full"
                >
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {questions.map((question, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{question.subject}</CardTitle>
                        <div className="flex items-center text-accent">
                          <Trophy className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{question.points} pts</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-base">{question.question}</p>
                      <RadioGroup
                        onValueChange={(value) => 
                          setSelectedAnswers(prev => ({
                            ...prev,
                            [index]: parseInt(value)
                          }))
                        }
                        className="space-y-3"
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={optIndex.toString()}
                              id={`q${index}-opt${optIndex}`}
                            />
                            <Label htmlFor={`q${index}-opt${optIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {showHints[index] && (
                        <div className="p-4 bg-muted rounded-md">
                          <p className="text-sm">{question.hint}</p>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => toggleHint(index)}
                        >
                          <Lightbulb className="mr-2 h-4 w-4" />
                          {showHints[index] ? "Hide Hint" : "Show Hint"}
                        </Button>
                        <Button
                          onClick={() => handleSubmit(index)}
                          disabled={selectedAnswers[index] === undefined}
                          className="bg-accent hover:bg-accent-dark"
                        >
                          Submit Answer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}