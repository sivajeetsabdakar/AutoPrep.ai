"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Newspaper, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const newsData = [
  {
    title: "CUET UG 2024 Registration Begins",
    description: "NTA starts registration process for Common University Entrance Test...",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
    link: "https://education.gov.in",
    date: "March 20, 2024"
  },
  {
    title: "New Education Policy Updates",
    description: "Major changes announced in the implementation of NEP 2020...",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    link: "https://education.gov.in",
    date: "March 19, 2024"
  },
  {
    title: "JEE Main 2024 Results Declared",
    description: "NTA announces results for JEE Main 2024 Session 1...",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
    link: "https://education.gov.in",
    date: "March 18, 2024"
  },
  {
    title: "JEE Main 2024 Results Declared",
    description: "NTA announces results for JEE Main 2024 Session 1...",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
    link: "https://education.gov.in",
    date: "March 18, 2024"
  },
  {
    title: "JEE Main 2024 Results Declared",
    description: "NTA announces results for JEE Main 2024 Session 1...",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
    link: "https://education.gov.in",
    date: "March 18, 2024"
  }
]

export default function Explore() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-10 px-4 md:px-6">
        <h1 className="text-4xl font-bold mb-10 flex items-center text-center md:text-left">
          <Newspaper className="mr-3 h-10 w-10 text-primary" />
          Education News & Updates
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsData.map((news, index) => (
            <Link key={index} href={news.link} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="overflow-hidden rounded-2xl shadow-md transition-transform transform hover:scale-101 hover:shadow-lg h-full flex flex-col">
                <div className="relative h-52">
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className="object-cover rounded-t-2xl"
                  />
                </div>
                <CardContent className="p-6 bg-white dark:bg-gray-900 rounded-b-2xl flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{news.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm flex-grow">{news.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{news.date}</span>
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}