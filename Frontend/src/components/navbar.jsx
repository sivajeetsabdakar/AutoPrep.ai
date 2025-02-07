"use client"

import { useState, useEffect } from "react"
import { Brain, Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ui/theme-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const links = [
    { href: "/problem-of-the-day", label: "Problem of the Day" },
    { href: "/generate", label: "Generate Questions" },
    { href: "/question-me", label: "Question Me" },
    { href: "/explore", label: "Explore" },
    { href: "/studybuddy", label: "Ask StudyBuddy" },
    { href: "/dashboard", label: "My Progress" },
    { href: "/leaderboard", label: "Leaderboard" }
  ]

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 w-full">
        <Link href="/" className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-accent" />
          <span className="font-bold text-xl">AutoPrep.ai</span>
        </Link>
        
        <div className="hidden lg:flex items-center space-x-6 ml-6 justify-center text-center">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={cn("transition-colors hover:text-accent", pathname === href ? "text-accent font-medium" : "text-muted-foreground")}>{label}</Link>
          ))}
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="secondary" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
          {isMobile && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </nav>
      
      {isMenuOpen && isMobile && (
        <div className="absolute top-16 left-0 w-full bg-background shadow-md p-4 space-y-4 lg:hidden">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="block text-center text-muted-foreground hover:text-accent" onClick={() => setIsMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
