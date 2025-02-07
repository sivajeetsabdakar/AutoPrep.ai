"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Brain, MessageCircle, Trophy, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function ProblemOfDay() {
  const [showHint, setShowHint] = useState(false)
  const [answer, setAnswer] = useState("")

  const problems = {
    physics: {
      question: "A particle is confined to a one-dimensional box of length L. If the particle is in its ground state, calculate the probability of finding it in the middle third of the box.",
      hint: "1. Recall that the ground state wavefunction is ψ(x) = √(2/L) sin(πx/L)\n2. The probability is given by ∫|ψ(x)|²dx over the region\n3. Set up the integral from L/3 to 2L/3"
    },
    chemistry: {
      question: "Predict the major product formed when propene reacts with HBr in the presence of organic peroxide.",
      hint: "1. This is an anti-Markovnikov addition\n2. Consider the radical mechanism\n3. Think about the stability of the intermediate radical"
    },
    mathematics: {
      question: "Find the volume of the solid obtained by rotating the region bounded by y = x², y = 2x, and the y-axis about the x-axis.",
      hint: "1. Identify the points of intersection\n2. Set up the washer method integral\n3. Use π(R² - r²) for each cross-section"
    },
    biology: {
      question: "Explain the role of calcium ions in the process of muscle contraction, specifically focusing on the interaction between actin and myosin.",
      hint: "1. Consider the role of troponin and tropomyosin\n2. Think about the sarcoplasmic reticulum\n3. Remember the sliding filament theory"
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-8 px-4 md:px-8 lg:px-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Problem Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Problem of the Day</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>500 points</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="physics">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="physics">Physics</TabsTrigger>
                    <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                    <TabsTrigger value="mathematics">Mathematics</TabsTrigger>
                    <TabsTrigger value="biology">Biology</TabsTrigger>
                  </TabsList>

                  {Object.entries(problems).map(([subject, problem]) => (
                    <TabsContent key={subject} value={subject} className="space-y-4">
                      <div className="space-y-4">
                        <h3 className="font-semibold">{subject.charAt(0).toUpperCase() + subject.slice(1)} Problem</h3>
                        <p>{problem.question}</p>
                        
                        {showHint && (
                          <Card className="bg-muted">
                            <CardContent className="p-4">
                              <p className="text-sm whitespace-pre-line">{problem.hint}</p>
                            </CardContent>
                          </Card>
                        )}

                        <div className="space-y-4">
                          <Textarea
                            placeholder="Type your answer here..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex space-x-4">
                            <Button onClick={() => setShowHint(!showHint)} variant="outline">
                              <Brain className="mr-2 h-4 w-4" />
                              {showHint ? "Hide Hint" : "Show Hint"}
                            </Button>
                            <Button variant="outline" className="bg-accent">Submit Answer</Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="text-muted-foreground">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-2 grid grid-cols-2 gap-5">
            {/* Streak Card */}
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Your Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-secondary">🔥 7</p>
                  <p className="text-sm text-muted-foreground mt-2">Days</p>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Card */}
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Today's Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Rahul M.", points: 500, position: 1 },
                    { name: "Priya S.", points: 450, position: 2 },
                    { name: "Amit K.", points: 400, position: 3 },
                  ].map((user) => (
                    <div key={user.position} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.position}.</span>
                        <span>{user.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{user.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discussion Section */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Share your thoughts or ask for help..."
                  className="mb-4"
                />
                <Button className="bg-accent hover:bg-accent-dark" >Post Comment</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}