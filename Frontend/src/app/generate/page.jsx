"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function Generate() {
  const [examType, setExamType] = useState("")
  const [subject, setSubject] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [fileUploaded, setFileUploaded] = useState(false)

  const handleGenerate = () => {
    setIsLoading(true)
    setTimeout(() => {
      setGeneratedQuestions([
        "What is the momentum of a particle with mass 2kg moving at 5m/s?",
        "Calculate the kinetic energy of the particle.",
        "If the particle collides elastically with a wall, what is its final velocity?"
      ])
      setIsLoading(false)
    }, 2000)
  }

  const handleFileUpload = (event) => {
    setFileUploaded(event.target.files?.length > 0)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-8 px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Generate Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <SelectItem value="mathematics">Mathematics</SelectItem>
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
                disabled={!examType || !subject || !fileUploaded || isLoading}
              >
                {isLoading ? "Generating..." : "Generate Questions"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Generated Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : generatedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {generatedQuestions.map((question, index) => (
                    <Card key={index} className="bg-muted">
                      <CardContent className="p-4">
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-muted-foreground">{question}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Upload an image to see AI-generated questions here
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}