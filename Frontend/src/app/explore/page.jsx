import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Newspaper, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const revalidate = 3600

const NEWS_QUERY = "JEE OR NEET OR CUET OR NTA education India"
const NEWS_FEED_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(
  NEWS_QUERY,
)}&hl=en-IN&gl=IN&ceid=IN:en`

const FALLBACK_NEWS = [
  {
    title: "NTA Examination Updates",
    description: "Check official notices for JEE, NEET, CUET, and other entrance exam announcements.",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
    link: "https://www.nta.ac.in/",
    date: "Official source",
    source: "NTA",
  },
  {
    title: "JEE Main Official Portal",
    description: "Latest JEE Main bulletins, information bulletins, answer keys, and result notices.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
    link: "https://jeemain.nta.ac.in/",
    date: "Official source",
    source: "JEE Main",
  },
  {
    title: "NEET UG Official Portal",
    description: "Latest NEET UG registration, admit card, answer key, and result updates.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    link: "https://neet.nta.nic.in/",
    date: "Official source",
    source: "NEET UG",
  },
]

function decodeHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function getTagValue(item, tagName) {
  const match = item.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"))
  return decodeHtml(match?.[1]?.trim() || "")
}

function stripHtml(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Recently updated"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function extractSource(title = "") {
  const parts = title.split(" - ")
  return parts.length > 1 ? parts.at(-1) : "Google News"
}

function cleanTitle(title = "") {
  const parts = title.split(" - ")
  return parts.length > 1 ? parts.slice(0, -1).join(" - ") : title
}

async function getEducationNews() {
  try {
    const response = await fetch(NEWS_FEED_URL, {
      next: { revalidate },
      headers: {
        "User-Agent": "AutoPrep.ai education news feed",
      },
    })

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}`)
    }

    const xml = await response.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .slice(0, 9)
      .map((match, index) => {
        const item = match[1]
        const rawTitle = getTagValue(item, "title")
        const description = stripHtml(getTagValue(item, "description"))
        const publishedAt = getTagValue(item, "pubDate")

        return {
          title: cleanTitle(rawTitle),
          description: description || "Read the full update from the source.",
          image: [
            "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
          ][index % 3],
          link: getTagValue(item, "link") || "https://news.google.com/",
          date: formatDate(publishedAt),
          source: extractSource(rawTitle),
        }
      })
      .filter((item) => item.title && item.link)

    return {
      news: items.length ? items : FALLBACK_NEWS,
      isLive: items.length > 0,
    }
  } catch {
    return {
      news: FALLBACK_NEWS,
      isLive: false,
    }
  }
}

export default async function Explore() {
  const { news, isLive } = await getEducationNews()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="px-4 py-10 md:px-6">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="flex items-center text-center text-4xl font-bold md:text-left">
            <Newspaper className="mr-3 h-10 w-10 text-primary" />
            Education News & Updates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLive ? "Updated hourly" : "Showing official sources"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Link key={`${item.title}-${item.link}`} href={item.link} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-md transition-transform hover:scale-[1.01] hover:shadow-lg">
                <div className="relative h-52">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </div>
                <CardContent className="flex flex-grow flex-col bg-white p-6 dark:bg-gray-900">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">{item.source}</p>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h2>
                  <p className="mb-4 flex-grow text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
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
