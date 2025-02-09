import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { BookOpen, Brain, Target, Upload } from "lucide-react"
import Image from "next/image"
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

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4 text-center">
            <StatCard number="50K+" label="Active Students" />
            <StatCard number="1M+" label="Questions Generated" />
            <StatCard number="95%" label="Success Rate" />
            <StatCard number="4.9" label="Average Rating" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
            Student Success Stories
          </h2>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            <TestimonialCard
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
              name="Priya Sharma"
              text="AutoPrep.ai helped me improve my JEE score by 35%. The personalized questions were exactly what I needed!"
              rating={5}
            />
            <TestimonialCard
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
              name="Rahul Patel"
              text="The daily problems keep me motivated. I've maintained a 30-day streak and seen significant improvement!"
              rating={5}
            />
            <TestimonialCard
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80"
              name="Anjali Kumar"
              text="The AI-generated questions are incredibly helpful. It's like having a personal tutor available 24/7."
              rating={4}
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

function TestimonialCard({ image, name, text, rating }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Image
            src={image}
            alt={name}
            width={64}
            height={64}
            className="rounded-full object-cover aspect-square"
          />
          <div className="ml-4">
            <h4 className="font-semibold">{name}</h4>
            <div className="flex text-yellow-400">
              {Array(rating)
                .fill("★")
                .map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

function StatCard({ number, label }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-3xl font-bold text-accent mb-2">{number}</p>
        <p className="text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
