# Code Story

**Transform code repositories into audio narratives.**

Code Story is an open-source, developer-first platform that analyzes GitHub repositories and generates engaging audio narratives using AI. Unlike generic tools, Code Story is purpose-built for developers who need deep, customizable control over how their code is analyzed and explained.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CODE STORY PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           FRONTEND (Next.js 15)                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  Landing    │  │  Dashboard  │  │  Story      │  │  Player     │     │   │
│  │  │  Page       │  │  /dashboard │  │  Creation   │  │  Component  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                                           │   │
│  │  Components: shadcn/ui + Waveform Visualization + Real-time Logs         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          API ROUTES (Next.js)                             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │ /api/chat/      │  │ /api/stories/   │  │ /api/stories/   │          │   │
│  │  │ intent          │  │ generate        │  │ [id]/restart    │          │   │
│  │  │                 │  │                 │  │                 │          │   │
│  │  │ AI Chat for     │  │ Full pipeline   │  │ Restart failed  │          │   │
│  │  │ customization   │  │ orchestration   │  │ generations     │          │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    ADVANCED CODE SYNTHESIS SYSTEM                         │   │
│  │                                                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    MULTI-PASS ANALYSIS ENGINE                        │ │   │
│  │  │                                                                      │ │   │
│  │  │  Pass 1: Symbol Extraction    Pass 2: Dependency Graph              │ │   │
│  │  │  ├─ Classes, Functions       ├─ Import/Export mapping              │ │   │
│  │  │  ├─ Interfaces, Types        ├─ Cross-file references             │ │   │
│  │  │  └─ Language detection        └─ Coupling strength (1-10)          │ │   │
│  │  │                                                                      │ │   │
│  │  │  Pass 3: AI Module Analysis   Pass 4: Architecture Layers          │ │   │
│  │  │  ├─ Purpose identification    ├─ Presentation layer               │ │   │
│  │  │  ├─ Complexity scoring        ├─ Business logic layer             │ │   │
│  │  │  └─ Pattern detection         └─ Data/Infrastructure layer        │ │   │
│  │  │                                                                      │ │   │
│  │  │  Pass 5: Design Pattern Recognition                                 │ │   │
│  │  │  ├─ Singleton, Factory, Repository                                 │ │   │
│  │  │  ├─ Service Layer, Middleware                                      │ │   │
│  │  │  └─ React Hooks, MVC patterns                                      │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                   │                                       │   │
│  │                                   ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    CODEBASE INDEX (Output)                          │ │   │
│  │  │                                                                      │ │   │
│  │  │  files[]        → Full content + language + token count            │ │   │
│  │  │  symbols[]      → All code symbols with line numbers               │ │   │
│  │  │  modules[]      → AI-analyzed modules with purpose                 │ │   │
│  │  │  layers[]       → Architecture layers identified                   │ │   │
│  │  │  dependencies[] → Directed graph of all imports/uses               │ │   │
│  │  │  patterns[]     → Design patterns found + locations                │ │   │
│  │  │  entryPoints[]  → Main files (index.ts, main.go, etc.)            │ │   │
│  │  │  coreModules[]  → Most-depended-upon modules                       │ │   │
│  │  │  metrics{}      → Files, lines, tokens, language breakdown        │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       AI AGENT PIPELINE                                   │   │
│  │                                                                           │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │   │
│  │  │  ANALYZER   │ -> │  ARCHITECT  │ -> │  NARRATOR   │ -> │SYNTHESIZER│ │   │
│  │  │  Agent      │    │  Agent      │    │  Agent      │    │  Agent    │ │   │
│  │  │             │    │             │    │             │    │           │ │   │
│  │  │ - Deep code │    │ - Dependency│    │ - Outline   │    │ - Chunk   │ │   │
│  │  │   analysis  │    │   graph     │    │   generation│    │   text    │ │   │
│  │  │ - 5-pass    │    │ - Layer     │    │ - Per-chapter│   │ - TTS API │ │   │
│  │  │   indexing  │    │   detection │    │   writing   │    │ - Upload  │ │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └───────────┘ │   │
│  │        │                  │                  │                  │        │   │
│  │        └──────────────────┴──────────────────┴──────────────────┘        │   │
│  │                                   │                                       │   │
│  │                    ┌──────────────┴──────────────┐                       │   │
│  │                    │    Processing Logs          │                       │   │
│  │                    │    (Real-time streaming)    │                       │   │
│  │                    └─────────────────────────────┘                       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         EXTERNAL SERVICES                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │   Claude AI     │  │   ElevenLabs    │  │    GitHub       │          │   │
│  │  │   (Anthropic)   │  │      TTS        │  │      API        │          │   │
│  │  │                 │  │                 │  │                 │          │   │
│  │  │ Via Vercel AI   │  │ Voice synthesis │  │ Repo analysis   │          │   │
│  │  │ Gateway         │  │ 10k char chunks │  │ Files, README   │          │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER (Supabase)                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  profiles   │  │  stories    │  │ processing_ │  │   Storage   │     │   │
│  │  │             │  │             │  │ logs        │  │   Bucket    │     │   │
│  │  │ User data   │  │ Generated   │  │             │  │             │     │   │
│  │  │ preferences │  │ narratives  │  │ Real-time   │  │ Audio files │     │   │
│  │  │             │  │ + chapters  │  │ agent logs  │  │ (MP3)       │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                                           │   │
│  │  + code_repositories, story_intents, story_chapters (with RLS)           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Advanced Code Synthesis System

The platform uses a sophisticated multi-pass analysis engine inspired by tools like RepoMix to deeply understand codebases:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CODE SYNTHESIS PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ REPOSITORY CONTENT FETCHER                                                  ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ • Fetch full repository tree from GitHub API                            │ ││
│  │ │ • Filter: Skip node_modules, .git, dist, build, __pycache__            │ ││
│  │ │ • Priority: README > package.json > src/ > lib/ > root files           │ ││
│  │ │ • Limits: 200 files max, 100KB per file, 5MB total                     │ ││
│  │ │ • Batch processing with rate limiting                                   │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: CodeFile[] with path, content, language, size, tokenCount          ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ PASS 1: SYMBOL EXTRACTION                                                   ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ Language-specific regex patterns for:                                   │ ││
│  │ │                                                                         │ ││
│  │ │ TypeScript/JavaScript:     Python:           Go:                       │ ││
│  │ │ ├─ class definitions      ├─ class          ├─ struct                 │ ││
│  │ │ ├─ function/arrow fn      ├─ def functions  ├─ interface              │ ││
│  │ │ ├─ interface/type         └─ imports        ├─ func                   │ ││
│  │ │ └─ import/export                            └─ import                 │ ││
│  │ │                                                                         │ ││
│  │ │ Rust:                      Java/Kotlin:      PHP/Ruby:                 │ ││
│  │ │ ├─ struct/enum            ├─ class          ├─ class                  │ ││
│  │ │ ├─ trait/impl             ├─ interface      ├─ module                 │ ││
│  │ │ └─ fn definitions         └─ methods        └─ functions              │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: CodeSymbol[] with name, type, filePath, startLine, endLine         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ PASS 2: DEPENDENCY GRAPH CONSTRUCTION                                       ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ For each file:                                                          │ ││
│  │ │ 1. Extract import statements → map to target modules                   │ ││
│  │ │ 2. Calculate coupling strength (1-10) based on import count            │ ││
│  │ │                                                                         │ ││
│  │ │ For each symbol:                                                        │ ││
│  │ │ 1. Search for references in other files                                │ ││
│  │ │ 2. Build bidirectional dependency/dependent lists                      │ ││
│  │ │                                                                         │ ││
│  │ │ Edge types: import | extends | implements | uses | creates             │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: DependencyEdge[] with from, to, type, strength                     ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ PASS 3: AI MODULE ANALYSIS (Claude)                                         ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ For each directory (up to 20):                                          │ ││
│  │ │ 1. Collect file names + extracted symbols                              │ ││
│  │ │ 2. Sample first 2000 chars of main file                                │ ││
│  │ │ 3. Send to Claude with structured output schema                        │ ││
│  │ │                                                                         │ ││
│  │ │ Claude returns:                                                         │ ││
│  │ │ ├─ purpose: One-sentence description                                   │ ││
│  │ │ ├─ complexity: low | medium | high                                     │ ││
│  │ │ └─ keyPatterns: Design patterns used                                   │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: ModuleAnalysis[] with path, purpose, exports, imports, complexity  ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ PASS 4: ARCHITECTURE LAYER DETECTION (Claude)                               ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ Input: All ModuleAnalysis summaries                                     │ ││
│  │ │                                                                         │ ││
│  │ │ Claude identifies 3-6 layers:                                          │ ││
│  │ │ ├─ Presentation/UI layer                                               │ ││
│  │ │ ├─ Application/Service layer                                           │ ││
│  │ │ ├─ Domain/Business logic layer                                         │ ││
│  │ │ ├─ Infrastructure/Data layer                                           │ ││
│  │ │ └─ Shared/Common utilities                                             │ ││
│  │ │                                                                         │ ││
│  │ │ Each layer includes:                                                    │ ││
│  │ │ ├─ name & description                                                  │ ││
│  │ │ ├─ modules belonging to this layer                                     │ ││
│  │ │ ├─ responsibilities                                                    │ ││
│  │ │ └─ dependencies on other layers                                        │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: ArchitectureLayer[]                                                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ PASS 5: DESIGN PATTERN RECOGNITION                                          ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ Pattern detection via symbol name analysis:                             │ ││
│  │ │                                                                         │ ││
│  │ │ Singleton     → *instance*, *singleton*                                │ ││
│  │ │ Factory       → *factory*, *create*                                    │ ││
│  │ │ Repository    → *repository*, *repo*                                   │ ││
│  │ │ Service Layer → *service* (class type)                                 │ ││
│  │ │ React Hooks   → use* (function type)                                   │ ││
│  │ │ Middleware    → */middleware/* in path                                 │ ││
│  │ │ Observer      → *observer*, *subscribe*, *emit*                        │ ││
│  │ │ Strategy      → *strategy*, *handler*                                  │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  │ Output: Pattern[] with name, description, locations[]                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ FINAL OUTPUT: CodebaseIndex                                                 ││
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ {                                                                       │ ││
│  │ │   files: CodeFile[],           // Full content + metadata              │ ││
│  │ │   symbols: CodeSymbol[],       // All extracted symbols                │ ││
│  │ │   modules: ModuleAnalysis[],   // AI-analyzed modules                  │ ││
│  │ │   layers: ArchitectureLayer[], // Detected architecture                │ ││
│  │ │   dependencies: DependencyEdge[], // Full dependency graph            │ ││
│  │ │   entryPoints: string[],       // main.*, index.*, app.*              │ ││
│  │ │   coreModules: string[],       // Most-depended-upon                   │ ││
│  │ │   patterns: Pattern[],         // Design patterns found                │ ││
│  │ │   metrics: {                                                           │ ││
│  │ │     totalFiles, totalLines, totalTokens,                               │ ││
│  │ │     languageBreakdown, avgFileSize, maxFileSize                        │ ││
│  │ │   }                                                                     │ ││
│  │ │ }                                                                       │ ││
│  │ └─────────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Narrative Synthesis Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        NARRATIVE SYNTHESIS PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Input: SynthesisContext                                                         │
│  ├─ storyId, intent, expertiseLevel                                             │
│  ├─ focusAreas[]                                                                │
│  └─ CodebaseIndex (from analysis)                                               │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ STEP 1: GENERATE NARRATIVE OUTLINE (Claude)                                 ││
│  │                                                                              ││
│  │ Input to Claude:                                                            ││
│  │ ├─ User intent & focus areas                                                ││
│  │ ├─ Codebase metrics (files, languages, entry points)                        ││
│  │ ├─ Architecture layers                                                       ││
│  │ ├─ Design patterns found                                                     ││
│  │ └─ Key module summaries                                                      ││
│  │                                                                              ││
│  │ Output: 4-7 chapters with:                                                  ││
│  │ ├─ title: "Introduction to the Architecture"                                ││
│  │ ├─ summary: What this chapter covers                                        ││
│  │ ├─ modules: Which code modules to reference                                 ││
│  │ ├─ keySymbols: Specific classes/functions to explain                        ││
│  │ └─ duration: Target minutes for this chapter                                ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ STEP 2: GENERATE CHAPTER CONTENT (Claude, per chapter)                      ││
│  │                                                                              ││
│  │ For each chapter:                                                           ││
│  │ 1. Gather relevant code snippets from referenced modules                    ││
│  │ 2. Extract symbols mentioned in keySymbols                                  ││
│  │ 3. Include previous chapter content for context continuity                  ││
│  │                                                                              ││
│  │ Claude writes ~150 words/minute of audio, including:                        ││
│  │ ├─ Natural pauses (...)                                                     ││
│  │ ├─ Transitions between topics                                               ││
│  │ ├─ Code references (file paths, function names)                             ││
│  │ └─ Style-appropriate tone (documentary/tutorial/podcast/etc.)               ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ OUTPUT: Full Narrative Script                                               ││
│  │                                                                              ││
│  │ {                                                                           ││
│  │   script: "Chapter 1: Introduction\n\n...\n\n---\n\nChapter 2: ...",        ││
│  │   chapters: [                                                               ││
│  │     { title: "Introduction", content: "..." },                              ││
│  │     { title: "Core Architecture", content: "..." },                         ││
│  │     ...                                                                      ││
│  │   ]                                                                          ││
│  │ }                                                                            ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Story Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STORY GENERATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  User Input                                                                      │
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 1. INTENT CAPTURE                                                           ││
│  │    • User enters GitHub URL                                                 ││
│  │    • Optional: AI chat conversation to understand goals                     ││
│  │    • Select style (Documentary/Tutorial/Podcast/Fiction/Technical)          ││
│  │    • Choose duration (5/15/30/45+ minutes)                                  ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 2. ANALYZER AGENT                                                           ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Connect to GitHub API                                              │ ││
│  │    │ • Fetch repository metadata (stars, forks, language)                 │ ││
│  │    │ • Scan directory structure                                           │ ││
│  │    │ • Identify key directories (src/, lib/, components/, etc.)           │ ││
│  │    │ • Parse package.json dependencies                                    │ ││
│  │    │ • Read README.md                                                     │ ││
│  │    │ • Sample key files for analysis                                      │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Repository Analysis Object                                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 3. ARCHITECT AGENT                                                          ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Build dependency graph                                             │ ││
│  │    │ • Identify core modules and their relationships                      │ ││
│  │    │ • Map data flow patterns                                             │ ││
│  │    │ • Detect architectural patterns (MVC, microservices, etc.)           │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Architecture Map                                                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 4. NARRATOR AGENT (Claude AI)                                               ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Generate narrative outline based on style                          │ ││
│  │    │ • Write full script (~150 words/minute target)                       │ ││
│  │    │ • Apply narrative style (documentary/tutorial/podcast/etc.)          │ ││
│  │    │ • Include natural pauses and transitions                             │ ││
│  │    │ • Generate chapter breakdown with timestamps                         │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Script Text + Chapters Array                                     ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 5. SYNTHESIZER AGENT (ElevenLabs)                                           ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Split script into <10k character chunks                            │ ││
│  │    │ • Process each chunk with TTS API                                    │ ││
│  │    │ • Use previous_text/next_text for continuity                         │ ││
│  │    │ • Combine audio buffers                                              │ ││
│  │    │ • Upload to Supabase Storage                                         │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Audio URL + Duration                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 6. COMPLETED STORY                                                          ││
│  │    • Audio file available for streaming/download                            ││
│  │    • Chapter navigation enabled                                             ││
│  │    • Script text for reference                                              ││
│  │    • Playback position saved                                                ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       │
│  │    profiles     │       │code_repositories│       │  story_intents  │       │
│  ├─────────────────┤       ├─────────────────┤       ├─────────────────┤       │
│  │ id (PK, FK)     │       │ id (PK)         │──┐    │ id (PK)         │       │
│  │ email           │       │ user_id (FK)    │  │    │ repository_id   │───┐   │
│  │ full_name       │       │ repo_url        │  │    │ intent_category │   │   │
│  │ avatar_url      │       │ repo_owner      │  │    │ user_description│   │   │
│  │ subscription    │       │ repo_name       │  │    │ focus_areas     │   │   │
│  │ preferences     │       │ primary_language│  │    │ conversation    │   │   │
│  └────────┬────────┘       │ analysis_cache  │  │    └─────────────────┘   │   │
│           │                └─────────────────┘  │              │           │   │
│           │                         │           │              │           │   │
│           │                         │           │              │           │   │
│           ▼                         ▼           │              ▼           │   │
│  ┌─────────────────────────────────────────────┴──────────────────────────┴───┐│
│  │                              stories                                        ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ id (PK)              │ title               │ narrative_style               ││
│  │ user_id (FK)         │ voice_id            │ expertise_level               ││
│  │ repository_id (FK)   │ script_text         │ target_duration_minutes       ││
│  │ intent_id (FK)       │ audio_url           │ actual_duration_seconds       ││
│  │ status               │ chapters (JSONB)    │ error_message                 ││
│  │ progress             │ progress_message    │ processing timestamps         ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│           │                                                                     │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┐                           ┌─────────────────┐             │
│  │ story_chapters  │                           │ processing_logs │             │
│  ├─────────────────┤                           ├─────────────────┤             │
│  │ id (PK)         │                           │ id (PK)         │             │
│  │ story_id (FK)   │                           │ story_id (FK)   │             │
│  │ chapter_number  │                           │ timestamp       │             │
│  │ title           │                           │ agent_name      │             │
│  │ start_time_secs │                           │ action          │             │
│  │ duration_secs   │                           │ details (JSONB) │             │
│  │ script_segment  │                           │ level           │             │
│  └─────────────────┘                           └─────────────────┘             │
│                                                                                  │
│  All tables have Row Level Security (RLS) policies for user isolation          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React 19 | App Router, Server Components |
| Styling | Tailwind CSS v4 + shadcn/ui | Design system |
| Audio UI | ElevenLabs UI Components | Orb, Waveform, Conversation |
| AI | Vercel AI SDK + Claude | Script generation |
| Voice | ElevenLabs API | Text-to-speech synthesis |
| Database | Supabase (PostgreSQL) | Data persistence + RLS |
| Storage | Supabase Storage | Audio file hosting |
| Auth | Supabase Auth | User authentication |
| Realtime | Supabase Realtime | Processing log streaming |

## Environment Variables

```bash
# Supabase
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (via Vercel AI Gateway - no key needed)
# Uses anthropic/claude-sonnet-4-20250514

# Voice Synthesis
ELEVENLABS_API_KEY=

# Auth Redirect (for dev)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
```

## Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run database migrations (SQL scripts in `/scripts`)
5. Start the dev server: `npm run dev`

## SQL Migrations

Run these in order in Supabase SQL Editor:

1. `001_create_codestory_tables.sql` - Core tables
2. `002_create_profile_trigger.sql` - Auto-create profiles
3. `003_create_storage_bucket.sql` - Audio storage
4. `004_add_play_count_function.sql` - Play tracking
5. `005_add_increment_play_count.sql` - Play count RPC
6. `006_create_processing_logs.sql` - Processing logs table
7. `007_fix_processing_logs_rls.sql` - RLS policies for logs

## License

MIT License - see LICENSE file for details.
