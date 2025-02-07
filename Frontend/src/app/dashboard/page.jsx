"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, Target, Trophy, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const performanceData = [
  { date: "Mon", score: 65 },
  { date: "Tue", score: 75 },
  { date: "Wed", score: 70 },
  { date: "Thu", score: 85 },
  { date: "Fri", score: 80 },
  { date: "Sat", score: 90 },
  { date: "Sun", score: 88 },
]

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Trophy className="h-5 w-5 text-accent" />}
            title="Total Points"
            value="2,500"
            subtitle="Top 10%"
          />
          <StatCard
            icon={<Brain className="h-5 w-5 text-secondary" />}
            title="Questions Solved"
            value="156"
            subtitle="+23 this week"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            title="Current Streak"
            value="7 days"
            subtitle="Personal best!"
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-secondary" />}
            title="Accuracy"
            value="85%"
            subtitle="+5% from last week"
          />
        </div>

        {/* Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Progress */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SubjectProgress
                subject="Physics"
                progress={75}
                topics={["Mechanics", "Thermodynamics", "Optics"]}
              />
              <SubjectProgress
                subject="Chemistry"
                progress={60}
                topics={["Organic", "Inorganic", "Physical"]}
              />
              <SubjectProgress
                subject="Mathematics"
                progress={85}
                topics={["Calculus", "Algebra", "Geometry"]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Solved Problem of the Day", time: "2 hours ago", points: "+100" },
                  { action: "Completed Physics Quiz", time: "5 hours ago", points: "+250" },
                  { action: "Achieved 7-day Streak", time: "1 day ago", points: "+500" },
                  { action: "Generated Practice Questions", time: "2 days ago", points: "+150" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                    <span className="text-secondary font-medium">{activity.points}</span>
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

function StatCard({ icon, title, value, subtitle }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
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

function SubjectProgress({ subject, progress, topics }  ) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-medium">{subject}</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex gap-2 flex-wrap">
        {topics.map((topic) => (
          <span key={topic} className="text-xs bg-muted px-2 py-1 rounded">
            {topic}
          </span>
        ))}
      </div>
    </div>
  )
}