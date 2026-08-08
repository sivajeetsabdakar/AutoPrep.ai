"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Crown, Medal, Trophy, Users } from "lucide-react"

const formatter = new Intl.NumberFormat("en-IN")

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState({ entries: [], summary: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Could not load leaderboard.")
        }

        if (isMounted) {
          setLeaderboard(data.leaderboard || { entries: [], summary: {} })
          setError("")
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Could not load leaderboard.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadLeaderboard()
    return () => {
      isMounted = false
    }
  }, [])

  const topThree = useMemo(() => leaderboard.entries.slice(0, 3), [leaderboard.entries])
  const remaining = useMemo(() => leaderboard.entries.slice(3), [leaderboard.entries])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
              <Trophy className="h-4 w-4" />
              Contribution ranking
            </div>
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Leaderboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              See who has contributed the most approved JEE and NEET practice questions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <Metric label="Contributors" value={leaderboard.summary?.contributors || 0} icon={Users} />
            <Metric label="Approved" value={leaderboard.summary?.acceptedSubmissions || 0} icon={Award} />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
              Loading leaderboard...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center text-center text-red-500">
              {error}
            </CardContent>
          </Card>
        ) : leaderboard.entries.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 flex-col items-center justify-center text-center">
              <Trophy className="mb-4 h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No approved submissions yet</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Contributors will appear here after submitted questions are approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {topThree.map((entry) => (
                <TopContributor key={entry.userId} entry={entry} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">All Contributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {remaining.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground">
                    More contributors will appear as submissions are approved.
                  </p>
                ) : (
                  remaining.map((entry) => <LeaderboardRow key={entry.userId} entry={entry} />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

function Metric({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-accent/10 p-2 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{formatter.format(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TopContributor({ entry }) {
  return (
    <Card className="border-accent/20">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Avatar name={entry.name} rank={entry.rank} />
          <RankIcon rank={entry.rank} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Rank #{entry.rank}</p>
        <h2 className="mt-1 truncate text-xl font-bold">{entry.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{entry.badge}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Pts" value={entry.points} />
          <Stat label="OK" value={entry.acceptedSubmissions} />
          <Stat label="Total" value={entry.totalSubmissions} />
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderboardRow({ entry }) {
  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <span className="w-8 text-lg font-bold text-muted-foreground">#{entry.rank}</span>
      <Avatar name={entry.name} rank={entry.rank} compact />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{entry.name}</h3>
        <p className="text-sm text-muted-foreground">
          {entry.acceptedSubmissions} accepted of {entry.totalSubmissions} submitted
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-accent">{formatter.format(entry.points)} pts</p>
        <p className="text-xs text-muted-foreground">{entry.badge}</p>
      </div>
    </div>
  )
}

function Avatar({ name, rank, compact = false }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold ${
        compact ? "h-10 w-10 text-sm" : "h-16 w-16 text-lg"
      }`}
      aria-label={name}
    >
      {initials || rank}
    </div>
  )
}

function RankIcon({ rank }) {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />
  return <Trophy className="h-6 w-6 text-accent" />
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-sm font-bold">{formatter.format(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
