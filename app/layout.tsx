import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AudioPlayerProvider } from "@/lib/audio-player-context"
import { FloatingPlayer } from "@/components/floating-player"
import { StorageErrorBoundary } from "@/components/storage-error-boundary"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Code Tales - Transform Code into Audio Stories",
  description:
    "The open-source platform that transforms code repositories into immersive audio stories. Built for developers, by developers.",
  keywords: ["code", "audio", "story", "developer", "open-source", "AI", "documentation", "codetales"],
  authors: [{ name: "Code Tales" }],
  openGraph: {
    title: "Code Tales",
    description: "Transform code repositories into audio stories",
    type: "website",
    url: "https://codetale.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Tales",
    description: "Transform code repositories into audio stories",
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        <StorageErrorBoundary>
          <AudioPlayerProvider>
            {children}
            <FloatingPlayer />
          </AudioPlayerProvider>
        </StorageErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
