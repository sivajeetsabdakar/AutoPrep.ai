"use client"

import React, { useState } from "react"
import { Brain, Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ui/theme-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NavLink = ({ href, children }) => {
  const pathname = usePathname()
  return (
    <Link 
      href={href} 
      className={cn(
        "transition-colors hover:text-accent",
        pathname === href ? "text-accent font-medium" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-bold text-xl">AutoPrep.ai</span>
          </Link>
        </div>

        {/* Center Section: Navigation Links (hidden on mobile) */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink href="/problem-of-day">Problem of the Day</NavLink>
          <NavLink href="/generate">Generate Questions</NavLink>
          <NavLink href="/dashboard">My Progress</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="secondary" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
          {/* Mobile menu toggle button (visible on mobile only) */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu: Visible only when mobileMenuOpen is true */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            <NavLink href="/problem-of-day">Problem of the Day</NavLink>
            <NavLink href="/generate">Generate Questions</NavLink>
            <NavLink href="/dashboard">My Progress</NavLink>
            <NavLink href="/leaderboard">Leaderboard</NavLink>
          </div>
        </div>
      )}
    </div>
  )
}
