// GitHub API utilities for repository analysis

export interface RepoFile {
  path: string
  type: "file" | "dir"
  size?: number
  content?: string
}

export interface RepoAnalysis {
  structure: RepoFile[]
  readme: string | null
  languages: Record<string, number>
  mainFiles: string[]
  keyDirectories: string[]
  packageInfo: Record<string, unknown> | null
}

export async function fetchRepoTree(owner: string, repo: string): Promise<RepoFile[]> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch repo tree: ${response.status}`)
  }

  const data = await response.json()

  return data.tree.map((item: { path: string; type: string; size?: number }) => ({
    path: item.path,
    type: item.type === "blob" ? "file" : "dir",
    size: item.size,
  }))
}

export async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`)
  }

  const data = await response.json()

  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8")
  }

  return data.content
}

export async function analyzeRepository(owner: string, repo: string): Promise<RepoAnalysis> {
  const tree = await fetchRepoTree(owner, repo)

  // Filter to important files
  const importantExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb", ".php"]
  const configFiles = ["package.json", "tsconfig.json", "pyproject.toml", "Cargo.toml", "go.mod", "pom.xml"]

  const files = tree.filter((f) => f.type === "file")
  const dirs = tree.filter((f) => f.type === "dir")

  // Identify key directories
  const keyDirectories = dirs
    .map((d) => d.path)
    .filter((p) => {
      const parts = p.split("/")
      return (
        parts.length === 1 &&
        !p.startsWith(".") &&
        !["node_modules", "dist", "build", "__pycache__", "vendor"].includes(p)
      )
    })

  // Find main entry files
  const mainFiles = files
    .filter((f) => {
      const name = f.path.split("/").pop() || ""
      return (
        name === "index.ts" ||
        name === "index.js" ||
        name === "main.ts" ||
        name === "main.py" ||
        name === "app.py" ||
        name === "server.ts" ||
        name === "server.js" ||
        configFiles.includes(name)
      )
    })
    .map((f) => f.path)

  // Try to fetch README
  let readme: string | null = null
  try {
    readme = await fetchFileContent(owner, repo, "README.md")
  } catch {
    try {
      readme = await fetchFileContent(owner, repo, "readme.md")
    } catch {
      // No readme found
    }
  }

  // Try to fetch package.json for dependencies
  let packageInfo: Record<string, unknown> | null = null
  try {
    const packageJson = await fetchFileContent(owner, repo, "package.json")
    packageInfo = JSON.parse(packageJson)
  } catch {
    // No package.json
  }

  // Fetch language statistics
  let languages: Record<string, number> = {}
  try {
    const langResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    if (langResponse.ok) {
      languages = await langResponse.json()
    }
  } catch {
    // Could not fetch languages
  }

  return {
    structure: tree,
    readme,
    languages,
    mainFiles,
    keyDirectories,
    packageInfo,
  }
}

export function summarizeRepoStructure(analysis: RepoAnalysis): string {
  const { structure, readme, languages, keyDirectories, packageInfo } = analysis

  const fileCount = structure.filter((f) => f.type === "file").length
  const dirCount = structure.filter((f) => f.type === "dir").length

  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang)

  let summary = `Repository Structure Summary:
- Total files: ${fileCount}
- Total directories: ${dirCount}
- Primary languages: ${topLanguages.join(", ") || "Unknown"}
- Key directories: ${keyDirectories.slice(0, 10).join(", ") || "None identified"}
`

  if (packageInfo) {
    const deps = Object.keys((packageInfo as { dependencies?: Record<string, string> }).dependencies || {}).slice(0, 10)
    if (deps.length > 0) {
      summary += `- Key dependencies: ${deps.join(", ")}\n`
    }
  }

  if (readme) {
    // Extract first paragraph or 500 chars of README
    const readmePreview = readme.split("\n\n")[0]?.slice(0, 500) || readme.slice(0, 500)
    summary += `\nREADME Preview:\n${readmePreview}`
  }

  return summary
}
