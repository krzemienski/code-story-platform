import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Code Story - Transform Code into Audio Narratives",
  description:
    "The open-source, developer-first platform that transforms code repositories into tailored audio narratives. Built for developers, by developers.",
  keywords: ["code", "audio", "narrative", "developer", "open-source", "AI", "documentation"],
  authors: [{ name: "Code Story" }],
  openGraph: {
    title: "Code Story",
    description: "Transform code repositories into audio narratives",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1a2e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
