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
  packageJson: Record<string, unknown> | null
  metadata: {
    stargazers_count?: number
    forks_count?: number
    language?: string
    description?: string
    topics?: string[]
  } | null
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

export async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  // Return null for 404 instead of throwing
  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`)
  }

  const data = await response.json()

  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8")
  }

  return data.content
}

async function fetchRepoMetadata(owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    if (response.ok) {
      const data = await response.json()
      return {
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        language: data.language,
        description: data.description,
        topics: data.topics,
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}

export async function analyzeRepository(owner: string, repo: string): Promise<RepoAnalysis> {
  const tree = await fetchRepoTree(owner, repo)

  // Filter to important files - expanded for more languages
  const configFiles = [
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "go.sum",
    "pom.xml",
    "build.gradle",
    "Makefile",
    "CMakeLists.txt",
    "requirements.txt",
    "setup.py",
    "Gemfile",
  ]

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
        !["node_modules", "dist", "build", "__pycache__", "vendor", "target", "bin", "obj"].includes(p)
      )
    })

  const mainFiles = files
    .filter((f) => {
      const name = f.path.split("/").pop() || ""
      return (
        name === "index.ts" ||
        name === "index.js" ||
        name === "main.ts" ||
        name === "main.go" ||
        name === "main.py" ||
        name === "app.py" ||
        name === "server.ts" ||
        name === "server.js" ||
        name === "main.rs" ||
        name === "lib.rs" ||
        name === "mod.rs" ||
        configFiles.includes(name)
      )
    })
    .map((f) => f.path)

  // Try to fetch README - now using null return
  let readme: string | null = null
  readme = await fetchFileContent(owner, repo, "README.md")
  if (!readme) {
    readme = await fetchFileContent(owner, repo, "readme.md")
  }
  if (!readme) {
    readme = await fetchFileContent(owner, repo, "Readme.md")
  }

  let packageJson: Record<string, unknown> | null = null

  // Try package.json first
  const packageJsonContent = await fetchFileContent(owner, repo, "package.json")
  if (packageJsonContent) {
    try {
      packageJson = JSON.parse(packageJsonContent)
    } catch {
      // Invalid JSON
    }
  }

  // If no package.json, try go.mod for Go projects
  if (!packageJson) {
    const goModContent = await fetchFileContent(owner, repo, "go.mod")
    if (goModContent) {
      packageJson = { type: "go", content: goModContent }
    }
  }

  // Try Cargo.toml for Rust projects
  if (!packageJson) {
    const cargoContent = await fetchFileContent(owner, repo, "Cargo.toml")
    if (cargoContent) {
      packageJson = { type: "rust", content: cargoContent }
    }
  }

  // Try pyproject.toml or requirements.txt for Python
  if (!packageJson) {
    const pyprojectContent = await fetchFileContent(owner, repo, "pyproject.toml")
    if (pyprojectContent) {
      packageJson = { type: "python", content: pyprojectContent }
    }
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

  const metadata = await fetchRepoMetadata(owner, repo)

  return {
    structure: tree,
    readme,
    languages,
    mainFiles,
    keyDirectories,
    packageJson,
    metadata,
  }
}

export function summarizeRepoStructure(analysis: RepoAnalysis): string {
  const { structure, readme, languages, keyDirectories, packageJson, metadata } = analysis

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

  if (metadata) {
    summary += `- Stars: ${metadata.stargazers_count || 0}
- Forks: ${metadata.forks_count || 0}
- Description: ${metadata.description || "No description"}
`
  }

  if (packageJson) {
    if (packageJson.type === "go") {
      summary += `- Go module detected\n`
    } else if (packageJson.type === "rust") {
      summary += `- Rust crate detected\n`
    } else if (packageJson.type === "python") {
      summary += `- Python project detected\n`
    } else {
      // Node.js project
      const deps = Object.keys((packageJson as { dependencies?: Record<string, string> }).dependencies || {}).slice(
        0,
        10,
      )
      if (deps.length > 0) {
        summary += `- Key dependencies: ${deps.join(", ")}\n`
      }
    }
  }

  if (readme) {
    // Extract first paragraph or 500 chars of README
    const readmePreview = readme.split("\n\n")[0]?.slice(0, 500) || readme.slice(0, 500)
    summary += `\nREADME Preview:\n${readmePreview}`
  }

  return summary
}
