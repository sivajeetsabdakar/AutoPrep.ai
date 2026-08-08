"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Maximize2, X } from "lucide-react"

export function ArchitectureImageViewer() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative block w-full overflow-hidden rounded-md border bg-white text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Open AutoPrep.ai software architecture diagram in fullscreen"
      >
        <Image
          src="/software-architecture.png"
          alt="AutoPrep.ai software architecture diagram"
          width={2048}
          height={1152}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="h-auto w-full"
          priority
        />
        <span className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow transition group-hover:bg-accent group-hover:text-accent-foreground">
          <Maximize2 className="h-4 w-4" />
          Open fullscreen
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen architecture diagram"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-md bg-white/95 p-2 text-foreground shadow focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close fullscreen architecture diagram"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-full w-full items-center justify-center overflow-auto">
            <Image
              src="/software-architecture.png"
              alt="AutoPrep.ai software architecture diagram fullscreen view"
              width={2048}
              height={1152}
              sizes="100vw"
              className="h-auto max-h-none w-auto max-w-none rounded-md"
            />
          </div>
        </div>
      )}
    </>
  )
}
