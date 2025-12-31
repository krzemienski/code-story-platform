/**
 * Flexible Content Generation Framework
 *
 * Supports multiple stylistic types, style combinations, various content lengths,
 * and diverse formats/genres with validated prompt structures.
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type PrimaryStyle = "fiction" | "documentary" | "tutorial" | "podcast" | "technical"
export type SecondaryStyle = "dramatic" | "humorous" | "suspenseful" | "inspirational" | "analytical" | "conversational"
export type ContentFormat = "narrative" | "dialogue" | "monologue" | "interview" | "lecture" | "story-within-story"
export type PacingStyle = "fast" | "moderate" | "slow" | "variable"
export type ToneIntensity = "subtle" | "moderate" | "intense"

export interface StyleConfiguration {
  primary: PrimaryStyle
  secondary?: SecondaryStyle
  format?: ContentFormat
  pacing?: PacingStyle
  toneIntensity?: ToneIntensity
  customModifiers?: string[]
}

export interface ContentParameters {
  targetDurationMinutes: number
  expertiseLevel: "beginner" | "intermediate" | "expert"
  style: StyleConfiguration
  focusAreas?: string[]
  excludeTopics?: string[]
  customInstructions?: string
}

export interface PromptValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  estimatedTokens: number
  estimatedWords: number
}

export interface GeneratedPrompt {
  systemPrompt: string
  userPrompt: string
  metadata: {
    estimatedWords: number
    estimatedDuration: number
    styleFingerprint: string
    validationResult: PromptValidationResult
  }
}

// =============================================================================
// STYLE DEFINITIONS
// =============================================================================

const PRIMARY_STYLE_CORES: Record<PrimaryStyle, string> = {
  fiction: `NARRATIVE FOUNDATION: Create an immersive fictional world where code becomes reality.
- Components are CHARACTERS with personalities, motivations, and relationships
- Functions are actions; classes are character archetypes or factions
- Data flows are journeys; API calls are communications between realms
- Bugs are antagonists; tests are protectors; documentation is ancient lore
- Design patterns are cultural traditions and inherited wisdom

STORYTELLING ELEMENTS:
- Rich world-building with distinct regions (modules/packages)
- Character development arcs for major components
- Conflict and resolution through technical challenges
- Dialogue that reveals component interactions
- Sensory descriptions for abstract concepts
- Emotional stakes around critical code paths`,

  documentary: `DOCUMENTARY FOUNDATION: Create authoritative, comprehensive coverage.
- Historical context and project origins
- Architectural analysis with specific metrics and statistics
- Expert insights explaining nuanced design decisions
- Comparison to industry standards and alternatives
- Evolution narrative showing how the code developed
- Legacy and future direction analysis

COVERAGE STRUCTURE:
- Opening hook establishing significance
- Systematic exploration of each major component
- Deep dives into implementation details
- Human element: the "why" behind decisions
- Synthesis and broader implications`,

  tutorial: `PEDAGOGICAL FOUNDATION: Build knowledge progressively and thoroughly.
- Foundation layer: core concepts everyone needs first
- Building blocks: individual components in isolation
- Integration layer: how pieces work together
- Mastery layer: advanced patterns and optimizations
- Practice layer: mental exercises and scenarios

TEACHING TECHNIQUES:
- Socratic method: pose questions, then answer
- Multiple analogies for difficult concepts
- Anticipate and address misconceptions
- Spaced repetition of key concepts
- Mental checkpoints throughout
- Celebrate progress moments`,

  podcast: `CONVERSATIONAL FOUNDATION: Create intimate, engaging dialogue.
- Senior developer sharing discoveries over coffee
- Genuine enthusiasm, surprise, occasional frustration
- Personal opinions clearly marked as such
- "War stories" relating to code patterns
- Natural tangents that circle back

SPEECH PATTERNS:
- Natural filler words sparingly: "so", "basically"
- Self-corrections: "Well, actually..."
- Thinking out loud: "Hmm, why would they..."
- Rhetorical questions frequently
- Reactions: "Wait, that's clever..."`,

  technical: `TECHNICAL FOUNDATION: Exhaustive deep-dive for expert practitioners.
- Specific implementation details, algorithms, data structures
- Exact file paths, class names, function signatures, line numbers
- Big-O complexity, memory implications, performance characteristics
- Comparison to academic papers and best practices
- Thread safety, race conditions, edge case analysis

COVERAGE REQUIREMENTS:
- Entry points and initialization sequences
- Core algorithms with verbal code walkthroughs
- Data flow and state management details
- Error handling and recovery mechanisms
- Security considerations and attack surfaces
- Testing strategies and coverage analysis`,
}

const SECONDARY_STYLE_MODIFIERS: Record<SecondaryStyle, string> = {
  dramatic: `DRAMATIC ELEMENTS:
- Build tension before key revelations
- Use dramatic pauses ("And then... everything changed")
- Heighten stakes around critical decisions
- Create cliffhangers between sections
- Emphasize conflict and resolution`,

  humorous: `HUMOR ELEMENTS:
- Witty observations about code patterns
- Playful metaphors and analogies
- Self-aware commentary on programming culture
- Light jokes about common developer experiences
- Never mock, always celebrate the craft`,

  suspenseful: `SUSPENSE ELEMENTS:
- Foreshadow challenges before revealing them
- Create mystery around architectural decisions
- Use "detective" framing for code exploration
- Build anticipation before solutions
- Strategic information reveals`,

  inspirational: `INSPIRATIONAL ELEMENTS:
- Highlight elegant solutions and clever design
- Celebrate the craft of programming
- Connect code to broader human endeavors
- Emphasize learning and growth opportunities
- Frame challenges as opportunities`,

  analytical: `ANALYTICAL ELEMENTS:
- Systematic breakdown of each component
- Pros and cons for every decision
- Comparative analysis throughout
- Data-driven observations when possible
- Logical progression of ideas`,

  conversational: `CONVERSATIONAL ELEMENTS:
- Direct address to listener: "you might wonder..."
- Rhetorical questions for engagement
- Casual transitions between topics
- Acknowledge shared experiences
- Inclusive language: "we" and "us"`,
}

const FORMAT_STRUCTURES: Record<ContentFormat, string> = {
  narrative: `FORMAT: Continuous prose narrative
- Flowing paragraphs with natural transitions
- Scene-setting and description
- Internal progression of ideas
- Beginning, middle, end structure`,

  dialogue: `FORMAT: Character dialogue
- Multiple "voices" representing components
- Conversational exchanges explaining interactions
- Question-and-answer patterns
- Character reactions and responses`,

  monologue: `FORMAT: Single-voice extended monologue
- Deep personal reflection style
- Stream of consciousness where appropriate
- Direct listener engagement
- Building argument or exploration`,

  interview: `FORMAT: Interview/Q&A structure
- Interviewer poses questions about the code
- Expert provides detailed answers
- Follow-up questions for depth
- Natural conversation flow`,

  lecture: `FORMAT: Academic lecture structure
- Clear thesis and objectives upfront
- Organized sections with previews
- Examples and demonstrations
- Summary and key takeaways`,

  "story-within-story": `FORMAT: Nested narrative structure
- Frame story introducing the codebase
- Inner stories for each major component
- Connections between narrative layers
- Return to frame story for synthesis`,
}

const PACING_GUIDES: Record<PacingStyle, string> = {
  fast: `PACING: Energetic and dynamic
- Shorter sentences and paragraphs
- Quick transitions between topics
- Momentum-building language
- Action-oriented descriptions`,

  moderate: `PACING: Balanced and steady
- Mix of sentence lengths
- Thoughtful transitions
- Time for key concepts to land
- Natural breathing room`,

  slow: `PACING: Contemplative and thorough
- Longer, more complex sentences
- Extended exploration of ideas
- Reflective pauses
- Deep immersion in details`,

  variable: `PACING: Dynamic variation
- Match pace to content importance
- Speed up for familiar concepts
- Slow down for complex ideas
- Build and release tension`,
}

// =============================================================================
// PROMPT GENERATION ENGINE
// =============================================================================

export class ContentGenerationFramework {
  /**
   * Generates a validated, optimized prompt for content generation
   */
  static generatePrompt(codeAnalysis: string, parameters: ContentParameters): GeneratedPrompt {
    // Validate parameters first
    const validation = this.validateParameters(parameters)

    // Calculate target metrics
    const wordsPerMinute = 150
    const targetWords = parameters.targetDurationMinutes * wordsPerMinute
    const targetTokens = Math.ceil(targetWords * 1.5) // Approximate tokens needed

    // Build the composite style prompt
    const stylePrompt = this.buildStylePrompt(parameters.style)

    // Build expertise adaptation
    const expertisePrompt = this.buildExpertisePrompt(parameters.expertiseLevel)

    // Build duration requirements
    const durationPrompt = this.buildDurationPrompt(parameters.targetDurationMinutes, targetWords)

    // Build focus/exclusion rules
    const focusPrompt = this.buildFocusPrompt(parameters.focusAreas, parameters.excludeTopics)

    // Compose system prompt
    const systemPrompt = this.composeSystemPrompt(
      stylePrompt,
      expertisePrompt,
      durationPrompt,
      focusPrompt,
      parameters.customInstructions,
    )

    // Compose user prompt
    const userPrompt = this.composeUserPrompt(codeAnalysis, parameters)

    // Generate style fingerprint for caching/debugging
    const styleFingerprint = this.generateStyleFingerprint(parameters.style)

    return {
      systemPrompt,
      userPrompt,
      metadata: {
        estimatedWords: targetWords,
        estimatedDuration: parameters.targetDurationMinutes,
        styleFingerprint,
        validationResult: validation,
      },
    }
  }

  /**
   * Validates content parameters before generation
   */
  static validateParameters(parameters: ContentParameters): PromptValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Duration validation
    if (parameters.targetDurationMinutes < 1) {
      errors.push("Duration must be at least 1 minute")
    }
    if (parameters.targetDurationMinutes > 120) {
      warnings.push("Very long durations (>120 min) may result in repetitive content")
    }

    // Style combination validation
    if (parameters.style.primary === "technical" && parameters.style.secondary === "humorous") {
      warnings.push("Technical + Humorous combination may reduce precision")
    }
    if (parameters.style.primary === "fiction" && parameters.expertiseLevel === "expert") {
      suggestions.push("Consider documentary or technical style for expert-level content")
    }

    // Format compatibility
    if (parameters.style.format === "dialogue" && parameters.style.primary === "technical") {
      warnings.push("Dialogue format is challenging for dense technical content")
    }

    // Pacing + Duration compatibility
    if (parameters.style.pacing === "fast" && parameters.targetDurationMinutes > 30) {
      suggestions.push("Consider moderate or variable pacing for longer content")
    }

    // Focus area validation
    if (parameters.focusAreas && parameters.focusAreas.length > 5) {
      warnings.push("Too many focus areas may dilute content depth")
    }

    // Calculate estimated tokens
    const estimatedWords = parameters.targetDurationMinutes * 150
    const estimatedTokens = Math.ceil(estimatedWords * 1.5)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      estimatedTokens,
      estimatedWords,
    }
  }

  /**
   * Builds composite style prompt from configuration
   */
  private static buildStylePrompt(style: StyleConfiguration): string {
    const parts: string[] = []

    // Primary style (required)
    parts.push(`PRIMARY STYLE: ${style.primary.toUpperCase()}`)
    parts.push(PRIMARY_STYLE_CORES[style.primary])

    // Secondary style (optional)
    if (style.secondary) {
      parts.push(`\nSECONDARY STYLE OVERLAY: ${style.secondary.toUpperCase()}`)
      parts.push(SECONDARY_STYLE_MODIFIERS[style.secondary])
    }

    // Format structure (optional, defaults to narrative)
    const format = style.format || "narrative"
    parts.push(`\n${FORMAT_STRUCTURES[format]}`)

    // Pacing guide (optional, defaults to moderate)
    const pacing = style.pacing || "moderate"
    parts.push(`\n${PACING_GUIDES[pacing]}`)

    // Tone intensity
    if (style.toneIntensity) {
      parts.push(`\nTONE INTENSITY: ${style.toneIntensity.toUpperCase()}`)
      parts.push(this.getToneIntensityGuide(style.toneIntensity))
    }

    // Custom modifiers
    if (style.customModifiers && style.customModifiers.length > 0) {
      parts.push("\nCUSTOM STYLE MODIFIERS:")
      style.customModifiers.forEach((mod) => parts.push(`- ${mod}`))
    }

    return parts.join("\n")
  }

  private static getToneIntensityGuide(intensity: ToneIntensity): string {
    switch (intensity) {
      case "subtle":
        return "- Understated expression of style elements\n- Hints rather than explicit statements\n- Professional restraint"
      case "moderate":
        return "- Balanced expression of style elements\n- Clear but not overwhelming\n- Natural integration"
      case "intense":
        return "- Full commitment to style elements\n- Bold, vivid expression\n- Maximum engagement"
    }
  }

  private static buildExpertisePrompt(level: "beginner" | "intermediate" | "expert"): string {
    switch (level) {
      case "beginner":
        return `EXPERTISE ADAPTATION: BEGINNER
- Explain ALL technical terms with simple analogies
- Never assume prior programming knowledge
- Use everyday metaphors for abstract concepts
- Progress slowly through complex topics
- Provide context for why things matter
- Celebrate small understandings`

      case "intermediate":
        return `EXPERTISE ADAPTATION: INTERMEDIATE
- Assume general programming knowledge
- Explain domain-specific and framework-specific concepts
- Use technical terms with brief clarifications
- Balance depth with accessibility
- Reference common patterns by name`

      case "expert":
        return `EXPERTISE ADAPTATION: EXPERT
- Use precise technical terminology freely
- Skip basic concept explanations
- Focus on implementation nuances and edge cases
- Discuss trade-offs and alternatives
- Reference advanced patterns and papers
- Assume familiarity with the ecosystem`
    }
  }

  private static buildDurationPrompt(minutes: number, targetWords: number): string {
    return `DURATION REQUIREMENTS:
- Target Duration: ${minutes} minutes of audio
- Target Word Count: ${targetWords} words (at 150 words/minute)
- You MUST fully utilize this time - do not summarize or abbreviate
- Explore EVERY significant aspect in appropriate detail
- If content naturally finishes early, expand with:
  - Additional examples and use cases
  - Historical context and evolution
  - Comparisons to alternatives
  - Practical implications and applications
  - Future considerations

WORD COUNT CHECKPOINTS:
- 25% mark (~${Math.round(targetWords * 0.25)} words): Foundation established
- 50% mark (~${Math.round(targetWords * 0.5)} words): Core content covered
- 75% mark (~${Math.round(targetWords * 0.75)} words): Deep exploration complete
- 100% mark (~${targetWords} words): Synthesis and conclusion`
  }

  private static buildFocusPrompt(focusAreas?: string[], excludeTopics?: string[]): string {
    const parts: string[] = []

    if (focusAreas && focusAreas.length > 0) {
      parts.push("FOCUS AREAS (prioritize these):")
      focusAreas.forEach((area, i) => parts.push(`${i + 1}. ${area}`))
    }

    if (excludeTopics && excludeTopics.length > 0) {
      parts.push("\nEXCLUDE/MINIMIZE:")
      excludeTopics.forEach((topic) => parts.push(`- ${topic}`))
    }

    return parts.join("\n")
  }

  private static composeSystemPrompt(
    stylePrompt: string,
    expertisePrompt: string,
    durationPrompt: string,
    focusPrompt: string,
    customInstructions?: string,
  ): string {
    const parts = [
      `You are an expert content creator specializing in transforming code analysis into compelling audio narratives.

Your output will be converted to speech, so write naturally and engagingly.
- Use varied sentence lengths for natural rhythm
- Include natural pauses (indicated by "...")
- Avoid overly complex nested sentences
- Spell out abbreviations on first use
- Use phonetic hints for unusual terms when needed`,

      "=".repeat(60),
      stylePrompt,
      "=".repeat(60),
      expertisePrompt,
      "=".repeat(60),
      durationPrompt,
    ]

    if (focusPrompt) {
      parts.push("=".repeat(60))
      parts.push(focusPrompt)
    }

    if (customInstructions) {
      parts.push("=".repeat(60))
      parts.push("CUSTOM INSTRUCTIONS:")
      parts.push(customInstructions)
    }

    parts.push("=".repeat(60))
    parts.push(`OUTPUT REQUIREMENTS:
- Write the COMPLETE narrative script
- Do NOT include chapter markers, timestamps, or formatting
- Do NOT include stage directions or production notes
- Write in continuous prose ready for text-to-speech
- Ensure natural flow when read aloud`)

    return parts.join("\n\n")
  }

  private static composeUserPrompt(codeAnalysis: string, parameters: ContentParameters): string {
    const targetWords = parameters.targetDurationMinutes * 150

    return `Based on the following code analysis, create a ${parameters.targetDurationMinutes}-minute (${targetWords} words) ${parameters.style.primary} narrative${parameters.style.secondary ? ` with ${parameters.style.secondary} elements` : ""}.

CODE ANALYSIS:
${codeAnalysis}

Remember: Write the FULL ${targetWords}-word script. Do not summarize or abbreviate. Fill the entire ${parameters.targetDurationMinutes} minutes with rich, engaging content.`
  }

  private static generateStyleFingerprint(style: StyleConfiguration): string {
    const parts = [style.primary]
    if (style.secondary) parts.push(style.secondary)
    if (style.format) parts.push(style.format)
    if (style.pacing) parts.push(style.pacing)
    if (style.toneIntensity) parts.push(style.toneIntensity)
    return parts.join("-")
  }

  /**
   * Get all available style options for UI
   */
  static getStyleOptions() {
    return {
      primaryStyles: Object.keys(PRIMARY_STYLE_CORES) as PrimaryStyle[],
      secondaryStyles: Object.keys(SECONDARY_STYLE_MODIFIERS) as SecondaryStyle[],
      formats: Object.keys(FORMAT_STRUCTURES) as ContentFormat[],
      pacingStyles: Object.keys(PACING_GUIDES) as PacingStyle[],
      toneIntensities: ["subtle", "moderate", "intense"] as ToneIntensity[],
    }
  }

  /**
   * Get recommended style combinations
   */
  static getRecommendedCombinations(): Array<{
    name: string
    description: string
    config: StyleConfiguration
  }> {
    return [
      {
        name: "Epic Fantasy",
        description: "Code as an epic adventure with dramatic tension",
        config: {
          primary: "fiction",
          secondary: "dramatic",
          format: "narrative",
          pacing: "variable",
          toneIntensity: "intense",
        },
      },
      {
        name: "Tech Documentary",
        description: "Authoritative, comprehensive analysis",
        config: {
          primary: "documentary",
          secondary: "analytical",
          format: "narrative",
          pacing: "moderate",
          toneIntensity: "moderate",
        },
      },
      {
        name: "Friendly Tutorial",
        description: "Patient, encouraging learning experience",
        config: {
          primary: "tutorial",
          secondary: "conversational",
          format: "monologue",
          pacing: "slow",
          toneIntensity: "moderate",
        },
      },
      {
        name: "Dev Chat",
        description: "Casual podcast-style exploration",
        config: {
          primary: "podcast",
          secondary: "humorous",
          format: "monologue",
          pacing: "moderate",
          toneIntensity: "moderate",
        },
      },
      {
        name: "Expert Deep Dive",
        description: "Dense technical analysis for practitioners",
        config: {
          primary: "technical",
          secondary: "analytical",
          format: "lecture",
          pacing: "moderate",
          toneIntensity: "intense",
        },
      },
      {
        name: "Mystery Investigation",
        description: "Code exploration as detective story",
        config: {
          primary: "fiction",
          secondary: "suspenseful",
          format: "story-within-story",
          pacing: "variable",
          toneIntensity: "intense",
        },
      },
      {
        name: "Inspirational Journey",
        description: "Uplifting exploration of elegant code",
        config: {
          primary: "documentary",
          secondary: "inspirational",
          format: "narrative",
          pacing: "moderate",
          toneIntensity: "moderate",
        },
      },
      {
        name: "Interactive Interview",
        description: "Q&A format diving into the codebase",
        config: {
          primary: "tutorial",
          secondary: "conversational",
          format: "interview",
          pacing: "moderate",
          toneIntensity: "subtle",
        },
      },
    ]
  }
}
