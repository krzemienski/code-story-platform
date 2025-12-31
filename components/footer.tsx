import Link from "next/link"
import { Logo } from "@/components/logo"
import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Transform code repositories into audio stories. Open source, developer-first.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/krzemienski/code-story-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/codetale_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">
                  Discover
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Developers</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/krzemienski/code-story-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/krzemienski/code-story-platform#self-hosting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Self-Hosting
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Community</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://discord.gg/codetale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/codetale_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/krzemienski/code-story-platform/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Report Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CodeTale. MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
