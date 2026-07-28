"use client"

import { useEffect, useMemo, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, Database, FileCheck2, Flame, RefreshCw, Target, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const EMPTY_METRICS = {
  questionCount: 0,
  acceptedSubmissionCount: 0,
  rejectedSubmissionCount: 0,
  contributorCount: 0,
  subjectBreakdown: [],
  examBreakdown: [],
  weeklyIngest: [],
  recentActivity: [],
}

const EMPTY_PROGRESS = {
  totalAttempts: 0,
  correctAttempts: 0,
  incorrectAttempts: 0,
  solvedQuestions: 0,
  accuracy: 0,
  streakDays: 0,
  subjectBreakdown: [],
  contextBreakdown: [],
  weeklyAttempts: [],
  recentAttempts: [],
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [metrics, setMetrics] = useState(EMPTY_METRICS)
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [isLoading, setIsLoading] = useState(true)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [error, setError] = useState("")
  const [progressError, setProgressError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadMetrics() {
      try {
        const response = await fetch("/api/dashboard-metrics", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to load metrics")
        }
        if (isMounted) {
          setMetrics(data.metrics || EMPTY_METRICS)
          setError("")
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load metrics")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMetrics()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProgress() {
      if (status === "loading") return
      if (!session?.user) {
        setProgress(EMPTY_PROGRESS)
        setProgressError("")
        return
      }

      setIsProgressLoading(true)
      try {
        const response = await fetch("/api/user-progress", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to load your progress")
        }
        if (isMounted) {
          setProgress(data.progress || EMPTY_PROGRESS)
          setProgressError("")
        }
      } catch (err) {
        if (isMounted) {
          setProgressError(err.message || "Failed to load your progress")
        }
      } finally {
        if (isMounted) {
          setIsProgressLoading(false)
        }
      }
    }

    loadProgress()
    return () => {
      isMounted = false
    }
  }, [session, status])

  const totalSubmissions = metrics.acceptedSubmissionCount + metrics.rejectedSubmissionCount
  const acceptanceRate = totalSubmissions ? Math.round((metrics.acceptedSubmissionCount / totalSubmissions) * 100) : 0
  const maxSubjectCount = Math.max(...metrics.subjectBreakdown.map((item) => item.total), 1)

  const examSummary = useMemo(
    () =>
      metrics.examBreakdown
        .map((item) => `${item.examType?.toUpperCase()}: ${formatNumber(item.total)}`)
        .join(" / ") || "No exam data yet",
    [metrics.examBreakdown],
  )

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live platform metrics from Neon and the RAG index</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Loading metrics" : "Live metrics"}
          </div>
        </div>

        {error && (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <section className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <p className="text-sm text-muted-foreground">
                Saved attempts, accuracy, and streak from authenticated practice.
              </p>
            </div>
            {isProgressLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {!session?.user && status !== "loading" ? (
            <Card>
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Sign in to track personal progress</p>
                  <p className="text-sm text-muted-foreground">Daily problem answers will save to your dashboard once you are signed in.</p>
                </div>
                <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>Sign In</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {progressError && (
                <Card className="border-destructive">
                  <CardContent className="p-4 text-sm text-destructive">{progressError}</CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Target className="h-5 w-5 text-accent" />}
                  title="Solved Questions"
                  value={formatNumber(progress.solvedQuestions)}
                  subtitle={`${formatNumber(progress.totalAttempts)} saved attempts`}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                  title="Accuracy"
                  value={`${progress.accuracy || 0}%`}
                  subtitle={`${formatNumber(progress.correctAttempts)} correct answers`}
                />
                <StatCard
                  icon={<Flame className="h-5 w-5 text-orange-500" />}
                  title="Practice Streak"
                  value={formatNumber(progress.streakDays)}
                  subtitle="Consecutive active days"
                />
                <StatCard
                  icon={<Brain className="h-5 w-5 text-secondary" />}
                  title="Incorrect"
                  value={formatNumber(progress.incorrectAttempts)}
                  subtitle="Use these to find weak areas"
                />
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Attempts This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={progress.weeklyAttempts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="attempts" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="correct" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Answers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progress.recentAttempts?.length ? (
                      <div className="space-y-4">
                        {progress.recentAttempts.map((attempt) => (
                          <div key={attempt.attemptId} className="border-b pb-3 last:border-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium capitalize">
                                {attempt.examType?.toUpperCase()} {attempt.subject}
                              </p>
                              <span className={attempt.isCorrect ? "text-sm text-green-600" : "text-sm text-red-600"}>
                                {attempt.isCorrect ? "Correct" : "Wrong"}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{attempt.questionText}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No saved answers yet. Try the daily problems while signed in.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Personal Subject Accuracy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {progress.subjectBreakdown?.length ? (
                    progress.subjectBreakdown.map((item) => (
                      <SubjectCoverage
                        key={item.subject}
                        subject={item.subject}
                        total={item.attempts}
                        progress={item.accuracy}
                        label={`${item.correct}/${item.attempts} correct`}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No personal subject data yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Database className="h-5 w-5 text-accent" />}
            title="Indexed Questions"
            value={formatNumber(metrics.questionCount)}
            subtitle={examSummary}
          />
          <StatCard
            icon={<FileCheck2 className="h-5 w-5 text-secondary" />}
            title="Accepted Submissions"
            value={formatNumber(metrics.acceptedSubmissionCount)}
            subtitle={`${acceptanceRate}% acceptance rate`}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-accent" />}
            title="Contributors"
            value={formatNumber(metrics.contributorCount)}
            subtitle="Google-auth users in Neon"
          />
          <StatCard
            icon={<Brain className="h-5 w-5 text-secondary" />}
            title="Subjects Covered"
            value={formatNumber(metrics.subjectBreakdown.length)}
            subtitle="Available for RAG retrieval"
          />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>New RAG Items This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyIngest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="items" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Subject Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {metrics.subjectBreakdown.length ? (
                metrics.subjectBreakdown.map((item) => (
                  <SubjectCoverage
                    key={item.subject}
                    subject={item.subject}
                    total={item.total}
                    progress={Math.round((item.total / maxSubjectCount) * 100)}
                    label={`${formatNumber(item.total)} questions`}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No indexed questions found yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentActivity.length ? (
                  metrics.recentActivity.map((activity, index) => (
                    <div key={`${activity.time}-${index}`} className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(activity.time)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent RAG or submission activity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SubjectCoverage({ subject, total, progress, label }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4">
        <span className="font-medium capitalize">{subject}</span>
        <span className="text-muted-foreground">{label || `${formatNumber(total)} questions`}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0)
}

function formatRelativeTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "recently"

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  return `${days}d ago`
}
