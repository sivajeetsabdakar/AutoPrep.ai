import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Brain, Database, Search, ShieldCheck, Target, Upload } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 bg-accent">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Master JEE & NEET with AI-Powered Learning
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Upload your notes, get personalized questions, and track your progress with our intelligent learning system.
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
              description="Simply upload your textbooks or notes, and our AI will analyze them to create personalized questions."
            />
            <FeatureCard
              icon={<Brain className="h-12 w-12 text-accent" />}
              title="Previous Year Questions based on your notes"
              description="Get practice PYQs that match your the topics in your uploaded image/text."
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
            Built Around Real Practice Data
          </h2>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            <FeatureCard
              icon={<Database className="h-12 w-12 text-accent" />}
              title="Indexed Question Bank"
              description="Practice is retrieved from the stored JEE/NEET question index instead of demo cards."
            />
            <FeatureCard
              icon={<Search className="h-12 w-12 text-accent" />}
              title="RAG Search"
              description="StudyBuddy and generated practice use semantic retrieval to find relevant question context."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-12 w-12 text-accent" />}
              title="Validated Contributions"
              description="Signed-in users can submit question images that are validated before entering the RAG index."
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
