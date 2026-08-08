import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Brain, Code2, Database, Search, ShieldCheck, Target, Upload } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 bg-accent">
        <Link
          href="/recruiters-developers"
          className="recruiter-float group absolute right-3 top-4 z-10 block max-w-64 rounded-md border border-white/30 bg-white/95 p-3 text-left text-accent shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white sm:right-4 sm:top-6 sm:max-w-72 lg:right-8"
          aria-label="For Recruiters and Developers: If you want to explore how it works, click here"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">For Recruiters and Developers</span>
          </div>
          <p className="mt-2 max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-300 group-hover:max-h-12 group-hover:opacity-100 group-focus:max-h-12 group-focus:opacity-100">
            If you want to explore how it works, Click here
          </p>
        </Link>
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Practice Smarter for JEE & NEET
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Upload notes, find topic-matched questions, solve daily practice, and track your progress.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/generate" className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Notes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10">
              <Link href="/problem-of-the-day">
                Try Daily Problem
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
            How AutoPrep.ai Works
          </h2>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <FeatureCard
              icon={<Upload className="h-12 w-12 text-accent" />}
              title="Upload Your Notes"
              description="Upload a notes image and get practice questions that match the topic."
            />
            <FeatureCard
              icon={<Brain className="h-12 w-12 text-accent" />}
              title="Previous Year Questions"
              description="Find JEE and NEET PYQs related to the concept you are studying."
            />
            <FeatureCard
              icon={<Target className="h-12 w-12 text-accent" />}
              title="Track Progress"
              description="Monitor your improvement with detailed analytics and focus on your weak areas."
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
            Practice Tools for Exam Prep
          </h2>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            <FeatureCard
              icon={<Database className="h-12 w-12 text-accent" />}
              title="Question Bank"
              description="Practice with JEE and NEET questions organized by exam, subject, and topic."
            />
            <FeatureCard
              icon={<Search className="h-12 w-12 text-accent" />}
              title="Smart Search"
              description="Find related questions even when your wording differs from the source material."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-12 w-12 text-accent" />}
              title="Question Contributions"
              description="Submit question images for review so useful practice material can be added."
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
