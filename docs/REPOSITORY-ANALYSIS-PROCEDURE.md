# Code Tales Repository Analysis Procedure

## Overview

This document defines the systematic procedure for analyzing code repositories to generate accurate, context-aware audio tales. It ensures consistent, high-quality analysis across all repository types.

---

## Phase 1: Initial Repository Assessment

### 1.1 Entry Point Discovery

Identify the main entry points of the repository:

\`\`\`
Priority Order:
1. package.json / pyproject.toml / Cargo.toml (dependency manifests)
2. main.* / index.* / app.* / server.* (application entry)
3. src/ / lib/ / app/ directories (source code roots)
4. README.md / docs/ (documentation)
5. Configuration files (.env.example, config.*, settings.*)
\`\`\`

### 1.2 Technology Stack Identification

Extract and categorize:

| Category | Examples | Analysis Focus |
|----------|----------|----------------|
| Language | TypeScript, Python, Rust | Syntax patterns, idioms |
| Framework | Next.js, FastAPI, Actix | Architecture conventions |
| Database | PostgreSQL, MongoDB, Redis | Data modeling patterns |
| Infrastructure | Docker, K8s, Serverless | Deployment context |

### 1.3 Repository Metrics

Collect baseline metrics:

- Total files and lines of code
- Primary languages (percentage breakdown)
- Directory depth and organization
- Test coverage indicators
- Documentation ratio

---

## Phase 2: Structural Analysis

### 2.1 Directory Pattern Recognition

Common patterns to identify:

\`\`\`
Feature-based:
├── features/
│   ├── auth/
│   ├── users/
│   └── products/

Layer-based:
├── controllers/
├── services/
├── models/
└── utils/

Domain-driven:
├── domain/
├── application/
├── infrastructure/
└── presentation/
\`\`\`

### 2.2 Component Relationship Mapping

Build a dependency graph:

1. **Import Analysis**: Track all imports/requires
2. **Export Analysis**: Identify public APIs
3. **Call Graph**: Map function/method calls
4. **Data Flow**: Trace data transformations

### 2.3 Critical Path Identification

Identify the most important code paths:

- Request/response lifecycle
- Data processing pipelines
- Authentication/authorization flows
- Error handling chains
- State management patterns

---

## Phase 3: Semantic Understanding

### 3.1 Naming Convention Analysis

Extract meaning from:

- File names (kebab-case, PascalCase patterns)
- Function/method names (verb patterns)
- Variable names (domain terminology)
- Type/interface names (noun patterns)

### 3.2 Comment and Documentation Mining

Parse and categorize:

\`\`\`typescript
// Types of valuable comments:
// - TODO/FIXME (technical debt indicators)
// - @param/@returns (API contracts)
// - Design decision explanations
// - Warning/caution notices
// - Reference links
\`\`\`

### 3.3 Pattern Recognition

Identify common design patterns:

| Pattern | Indicators | Narrative Value |
|---------|-----------|-----------------|
| Singleton | getInstance, private constructor | "The guardian of shared state" |
| Factory | create*, build*, make* | "The creator of components" |
| Observer | subscribe, emit, on/off | "The messenger network" |
| Strategy | interface + multiple implementations | "The shapeshifter" |
| Middleware | next(), chain patterns | "The gatekeepers" |

---

## Phase 4: Context Enrichment

### 4.1 Historical Context

If git history available:

- Initial commit message (project origin)
- Major version tags (evolution milestones)
- Recent commit patterns (active areas)
- Contributor patterns (expertise distribution)

### 4.2 External Context

Research and incorporate:

- Framework documentation references
- Known best practices for the stack
- Common pitfalls and anti-patterns
- Performance considerations

### 4.3 User Intent Alignment

Map analysis to user goals:

| Intent | Analysis Focus | Narrative Emphasis |
|--------|---------------|-------------------|
| Architecture Understanding | High-level structure | "Bird's eye view" |
| Onboarding | Entry points, flows | "Getting started journey" |
| Feature Focus | Specific module deep-dive | "Behind the scenes" |
| Code Review Prep | Quality patterns, risks | "Quality assessment" |
| Learning Patterns | Design patterns, idioms | "Craftsman's guide" |

---

## Phase 5: Output Generation

### 5.1 Analysis Document Structure

\`\`\`json
{
  "repository": {
    "name": "string",
    "description": "string",
    "primaryLanguage": "string",
    "frameworks": ["string"],
    "metrics": {
      "totalFiles": "number",
      "totalLines": "number",
      "testCoverage": "percentage"
    }
  },
  "architecture": {
    "pattern": "string",
    "layers": ["Layer"],
    "entryPoints": ["EntryPoint"],
    "criticalPaths": ["Path"]
  },
  "components": [{
    "name": "string",
    "type": "string",
    "responsibility": "string",
    "dependencies": ["string"],
    "complexity": "low|medium|high",
    "narrativeHook": "string"
  }],
  "patterns": [{
    "name": "string",
    "locations": ["string"],
    "explanation": "string"
  }],
  "narrativeElements": {
    "protagonists": ["Component"],
    "conflicts": ["TechnicalChallenge"],
    "resolutions": ["Solution"],
    "themes": ["string"]
  }
}
\`\`\`

### 5.2 Narrative Element Extraction

For each major component, extract:

1. **Character Profile**: Personality, role, responsibilities
2. **Relationships**: Dependencies, collaborators, conflicts
3. **Journey Arc**: Initialization, operation, edge cases
4. **Dramatic Moments**: Error handling, edge cases, optimizations

### 5.3 Quality Validation

Before generating tales, validate:

- [ ] All major components identified
- [ ] Entry points clearly mapped
- [ ] Data flow understood end-to-end
- [ ] Error handling patterns documented
- [ ] Test coverage areas noted
- [ ] Performance considerations identified
- [ ] Security patterns recognized

---

## Phase 6: Tale Generation Mapping

### 6.1 Style-to-Analysis Mapping

| Tale Style | Analysis Sections Used | Generation Focus |
|------------|----------------------|------------------|
| Fiction | Components → Characters, Flows → Journeys | Narrative arc, world-building |
| Documentary | Metrics, Patterns, History | Facts, evolution, significance |
| Tutorial | Entry points, Flows, Patterns | Progressive learning path |
| Podcast | Interesting patterns, Trade-offs | Conversational exploration |
| Technical | All sections, deep detail | Exhaustive coverage |

### 6.2 Duration-to-Depth Mapping

| Duration | Analysis Depth | Component Coverage |
|----------|---------------|-------------------|
| 5-10 min | High-level overview | Top 3-5 components |
| 10-20 min | Moderate depth | Top 5-10 components |
| 20-40 min | Detailed | All major components |
| 40-60 min | Comprehensive | All components + interactions |
| 60+ min | Exhaustive | Complete codebase journey |

### 6.3 Expertise-to-Detail Mapping

| Expertise | Technical Terms | Analogies | Code Specifics |
|-----------|----------------|-----------|----------------|
| Beginner | Explained simply | Heavy use | Minimal, conceptual |
| Intermediate | With context | Moderate | Referenced by name |
| Expert | Freely used | Minimal | Detailed, line-specific |

---

## Appendix A: Analysis Checklist

### Pre-Analysis
- [ ] Repository access confirmed
- [ ] User intent captured
- [ ] Target duration set
- [ ] Expertise level identified
- [ ] Style preference recorded

### During Analysis
- [ ] Entry points identified
- [ ] Tech stack documented
- [ ] Directory structure mapped
- [ ] Key components cataloged
- [ ] Dependencies graphed
- [ ] Patterns recognized
- [ ] Documentation parsed

### Post-Analysis
- [ ] Analysis document complete
- [ ] Narrative elements extracted
- [ ] Style mapping verified
- [ ] Quality validation passed
- [ ] Ready for generation

---

## Appendix B: Common Repository Archetypes

### Web Application (Next.js/React)
\`\`\`
Focus: Pages, components, API routes, state management
Key files: app/, pages/, components/, lib/, api/
Narrative: User journey through the interface
\`\`\`

### API Service (FastAPI/Express)
\`\`\`
Focus: Endpoints, middleware, database, auth
Key files: routes/, controllers/, models/, middleware/
Narrative: Request lifecycle journey
\`\`\`

### CLI Tool (Commander/Click)
\`\`\`
Focus: Commands, arguments, execution flow
Key files: commands/, cli.*, main.*
Narrative: User command execution story
\`\`\`

### Library/SDK
\`\`\`
Focus: Public API, internal implementation, examples
Key files: src/, lib/, index.*, examples/
Narrative: How consumers use the library
\`\`\`

### Microservice
\`\`\`
Focus: Communication, events, data contracts
Key files: events/, handlers/, schemas/, clients/
Narrative: Service interactions and data flow
\`\`\`

---

## Appendix C: Troubleshooting Analysis Issues

### Issue: Repository too large
**Solution**: Focus on entry points and user-specified areas first, expand progressively

### Issue: No clear structure
**Solution**: Use file naming patterns and import analysis to infer organization

### Issue: Minimal documentation
**Solution**: Rely heavily on code patterns, naming conventions, and test files for context

### Issue: Multiple languages
**Solution**: Identify primary language by line count, analyze language boundaries

### Issue: Monorepo structure
**Solution**: Treat each package/app as separate analysis unit, then synthesize

---

*Version 1.0 - Last Updated: January 2026*
