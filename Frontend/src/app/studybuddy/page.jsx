"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Upload, Bot } from "lucide-react"

export default function StudyBuddy() {
  const [doubt, setDoubt] = useState("")
  const [response, setResponse] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    setResponse("") // Clear previous response
    try {
      const formData = new FormData()
      formData.append("doubt", doubt)
  
      const res = await fetch("/api/studybuddy", {
        method: "POST",
        body: formData,
      })
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
  
      const data = await res.json()
      console.log("API response data:", data) // Debugging log
  
      // Access nested "reply" key safely
      if (data?.res?.reply) {
        setResponse(data.res.reply)
      } else {
        setResponse("No response received from the API.")
      }
    } catch (error) {
      console.error("Error submitting doubt:", error)
      setResponse("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-6 w-6 text-accent" />
                Ask StudyBuddy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Type your doubt here..."
                value={doubt}
                onChange={(e) => setDoubt(e.target.value)}
                className="min-h-[150px]"
              />

              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Attach a document (optional)
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      id="document-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={() => setIsUploading(true)}
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="document-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-accent hover:bg-accent-dark"
                  onClick={handleSubmit}
                  disabled={!doubt.trim() || isLoading}
                >
                  {isLoading ? "Submitting..." : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Submit Doubt
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat Response */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle>StudyBuddy's Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{response}</p>
              </CardContent>
            </Card>
          )}

          {/* Chat History */}
          <Card>
            <CardHeader>
              <CardTitle>Previous Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Example conversation */}
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <Bot className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">StudyBuddy</p>
                    <p className="text-muted-foreground">
                      Hello! How can I help you with your studies today?
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
