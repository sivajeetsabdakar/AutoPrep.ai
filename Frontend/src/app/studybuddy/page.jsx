"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, BookOpen, CheckCircle2, ChevronDown, ChevronUp, RotateCcw, Send, SlidersHorizontal, Sparkles, User, XCircle } from "lucide-react"

const STORAGE_KEY = "autoprep.studybuddy.messages"

const STARTER_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: "Ask me a JEE or NEET doubt. I can use your previous messages plus the RAG question bank to explain concepts and suggest practice.",
  sources: [],
}

export default function StudyBuddy() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([STARTER_MESSAGE])
  const [examType, setExamType] = useState("all")
  const [subject, setSubject] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  const recentMessages = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .filter((message) => message.id !== "welcome")
        .slice(-10)
        .map(({ role, content }) => ({ role, content })),
    [messages],
  )

  const handleSubmit = async () => {
    const doubt = input.trim()
    if (!doubt || isLoading) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: doubt,
      sources: [],
    }
    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("doubt", doubt)
      formData.append("messages", JSON.stringify(recentMessages))
      if (examType !== "all") formData.append("examType", examType)
      if (subject !== "all") formData.append("subject", subject)

      const res = await fetch("/api/studybuddy", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`)
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I could not generate a response.",
          sources: data.sources || [],
        },
      ])
    } catch (error) {
      console.error("Error submitting doubt:", error)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I could not reach StudyBuddy right now. Please try again in a moment.",
          sources: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([STARTER_MESSAGE])
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4">
        <header className="flex items-center justify-between border-b py-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-semibold">StudyBuddy</h1>
            </div>
            <p className="text-sm text-muted-foreground">RAG-powered tutor with memory for this chat</p>
          </div>
          <Button variant="ghost" size="icon" onClick={resetChat} title="Reset chat">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </header>

        <section className="flex-1 overflow-y-auto py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar role="assistant" />
                <div className="rounded-lg border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Thinking with RAG context...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </section>

        <footer className="border-t bg-background py-4">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:w-28">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </div>
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select
                    value={examType}
                    onValueChange={(value) => {
                      setExamType(value)
                      setSubject("all")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All exams</SelectItem>
                      <SelectItem value="jee">JEE</SelectItem>
                      <SelectItem value="neet">NEET</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={subject} onValueChange={setSubject} disabled={examType === "all"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      {examType === "jee" && <SelectItem value="mathematics">Mathematics</SelectItem>}
                      {examType === "neet" && <SelectItem value="biology">Biology</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Ask a doubt, paste a question, or continue the previous explanation..."
                  className="max-h-44 min-h-16 resize-none border-0 px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button size="icon" onClick={handleSubmit} disabled={!input.trim() || isLoading} title="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              StudyBuddy can make mistakes. Verify important formulas and exam notices.
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === "user"

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar role="assistant" />}
      <div className={`max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
              : "rounded-lg border bg-card px-4 py-3 text-sm leading-6 text-card-foreground"
          }
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!isUser && message.sources?.length > 0 && <Sources sources={message.sources} />}
      </div>
      {isUser && <Avatar role="user" />}
    </article>
  )
}

function Avatar({ role }) {
  const Icon = role === "user" ? User : Sparkles
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

function Sources({ sources }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        Retrieved practice from question bank
      </div>
      <div className="grid gap-2">
        {sources.slice(0, 3).map((source, index) => (
          <PracticeSource key={source.id || index} source={source} index={index} />
        ))}
      </div>
    </div>
  )
}

function PracticeSource({ source, index }) {
  const [isOpen, setIsOpen] = useState(index === 0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [submittedAnswer, setSubmittedAnswer] = useState("")

  const answer = normalizeAnswer(source.ans)
  const isIntegerAnswer = answer.kind === "integer"
  const options = extractOptions(source.text)
  const questionText = options.length >= 2 ? stripOptions(source.text) : source.text
  const hasAnswer = Boolean(answer.value)
  const hasAnswered = Boolean(submittedAnswer)
  const isCorrect = hasAnswered && answersMatch(submittedAnswer, answer.value)

  const handleSubmit = (value) => {
    if (!hasAnswer) return
    setSubmittedAnswer(value.trim())
  }

  return (
    <div className="rounded-md border bg-muted/40 text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium">
            {source.examType?.toUpperCase()} {source.subject}
            {source.chapter ? ` - ${source.chapter}` : ""}
          </p>
          <p className={`mt-1 text-muted-foreground ${isOpen ? "" : "line-clamp-2"}`}>
            {questionText || "Question image available"}
          </p>
        </div>
        {isOpen ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />}
      </button>

      {isOpen && (
        <div className="space-y-3 border-t p-3">
          {source.image && (
            <img src={source.image} alt="Retrieved question" className="max-h-72 w-full rounded-md border bg-background object-contain" />
          )}

          {options.length >= 2 ? (
            <div className="grid gap-2">
              {options.map((option) => {
                const selected = submittedAnswer === option.value
                const correct = answersMatch(option.value, answer.value)
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    disabled={!hasAnswer}
                    onClick={() => handleSubmit(option.value)}
                    className={`h-auto justify-start whitespace-normal text-left ${
                      selected && correct
                        ? "border-green-500 bg-green-500/10 text-green-700"
                        : selected
                          ? "border-red-500 bg-red-500/10 text-red-700"
                          : ""
                    }`}
                  >
                    <span className="mr-2 font-bold">({option.value})</span>
                    <span>{option.label || `Option ${option.value}`}</span>
                  </Button>
                )
              })}
            </div>
          ) : isIntegerAnswer ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={selectedAnswer}
                onChange={(event) => setSelectedAnswer(event.target.value)}
                placeholder="Enter your answer"
                disabled={!hasAnswer}
              />
              <Button type="button" onClick={() => handleSubmit(selectedAnswer)} disabled={!selectedAnswer.trim() || !hasAnswer}>
                Check
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["1", "2", "3", "4"].map((option) => {
                const selected = submittedAnswer === option
                const correct = answersMatch(option, answer.value)
                return (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    disabled={!hasAnswer}
                    onClick={() => handleSubmit(option)}
                    className={
                      selected && correct
                        ? "border-green-500 bg-green-500/10 text-green-700"
                        : selected
                          ? "border-red-500 bg-red-500/10 text-red-700"
                          : ""
                    }
                  >
                    ({option})
                  </Button>
                )
              })}
            </div>
          )}

          {!hasAnswer && <p className="text-muted-foreground">No stored answer is available for this retrieved question.</p>}

          {hasAnswered && (
            <div className={`flex items-start gap-2 rounded-md border p-3 ${isCorrect ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-red-500/40 bg-red-500/10 text-red-700"}`}>
              {isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <p className="font-medium">{isCorrect ? "Correct answer" : "Wrong answer"}</p>
                {!isCorrect && <p className="mt-1">Correct answer: {answer.display}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function normalizeAnswer(rawAnswer = "") {
  const raw = String(rawAnswer).trim()
  if (!raw) return { kind: "missing", value: "", display: "" }

  if (/^i/i.test(raw)) {
    const value = raw.slice(1).trim()
    return { kind: "integer", value: cleanAnswerValue(value), display: value }
  }

  const optionMatch = raw.match(/[1-4]/)
  const value = optionMatch ? optionMatch[0] : raw
  return { kind: "mcq", value: cleanAnswerValue(value), display: value }
}

function cleanAnswerValue(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^option\s+/i, "")
    .replace(/^\(|\)$/g, "")
}

function answersMatch(given, correct) {
  return cleanAnswerValue(given) === cleanAnswerValue(correct)
}

function extractOptions(text = "") {
  const matches = [...String(text).matchAll(/(?:^|\s)\(([1-4])\)\s*([\s\S]*?)(?=\s+\([1-4]\)\s*|$)/g)]
  return matches
    .map((match) => ({
      value: match[1],
      label: match[2].replace(/\s+/g, " ").trim(),
    }))
    .filter((option) => option.label)
}

function stripOptions(text = "") {
  const firstOption = String(text).search(/(?:^|\s)\([1-4]\)\s*/)
  if (firstOption === -1) return text
  return text.slice(0, firstOption).trim()
}
