"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Star, Crown } from "lucide-react"
import Image from "next/image"

const leaderboardData = [
  {
    rank: 1,
    name: "Priya Sharma",
    points: 15000,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    badge: "🏆 Champion"
  },
  {
    rank: 2,
    name: "Rahul Patel",
    points: 14500,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    badge: "🥈 Expert"
  },
  {
    rank: 3,
    name: "Anjali Kumar",
    points: 14000,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    badge: "🥉 Master"
  }
]

export default function Leaderboard() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-4xl">
                <Trophy className="mr-2 h-8 w-8 text-yellow-500" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Top 3 Podium */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {leaderboardData.slice(0, 3).map((user) => (
                  <Card key={user.rank} className="bg-muted">
                    <CardContent className="p-6 text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          fill
                          className="rounded-full object-cover"
                        />
                        {user.rank === 1 && (
                          <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{user.name}</h3>
                      <p className="text-accent font-semibold mb-2">
                        {user.points.toLocaleString()} pts
                      </p>
                      <span className="inline-block bg-background px-3 py-1 rounded-full text-sm">
                        {user.badge}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Rest of Leaderboard */}
              <div className="space-y-4">
                {Array.from({ length: 7 }, (_, i) => ({
                  rank: i + 4,
                  name: `Student ${i + 4}`,
                  points: 13000 - (i * 500),
                  avatar: `https://images.unsplash.com/photo-1438761681033-6461ffad8d80`,    
                })).map((user) => (
                  <div
                    key={user.rank}
                    className="flex items-center p-4 bg-muted rounded-lg"
                  >
                    <span className="w-8 text-lg font-bold">{user.rank}</span>
                    <div className="relative w-10 h-10 mx-4">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                    </div>
                    <span className="font-semibold text-accent">
                      {user.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}