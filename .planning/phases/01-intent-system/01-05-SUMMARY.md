# Summary 01-05: Story Plan Generation

## Status: PARTIAL (Gap Identified)

## Discovery

Story generation infrastructure exists but does NOT currently fetch/use intent data.

## Validation Results

| Gate | Result |
|------|--------|
| Intent used in generation | ⚠️ GAP - `intent_id` not fetched |
| StoryPlan/ChapterPlan types | ✅ PASS (defined in types.ts) |
| STORY_ARCHITECT_PROMPT | ✅ PASS (comprehensive) |

## What Exists

### TypeScript Types (`lib/types.ts`)
```typescript
export interface StoryPlan {
  title: string
  estimated_duration_minutes: number
  chapters: ChapterPlan[]
  narrative_style: NarrativeStyle
  voice_recommendation: string
}

export interface ChapterPlan {
  number: number
  title: string
  duration_minutes: number
  focus_files: string[]
  key_concepts: string[]
}
```

### Story Architect Prompt (`lib/agents/prompts.ts`)
- **21 lines** of base prompt defining story transformation rules
- **Narrative Style Prompts**: Detailed prompts for each of 5 styles
  - Fiction: 30+ lines with world-building rules
  - Documentary: 25+ lines with structure guidance
  - Tutorial: Educational progression rules
  - Podcast: Conversational format
  - Technical: Expert-level deep-dive

### Current Generation Flow (`app/api/stories/generate/route.ts`)
Uses from story record:
- ✅ `narrative_style`
- ✅ `expertise_level`
- ✅ `target_duration_minutes`
- ❌ `intent_id` (not fetched)
- ❌ Intent's `user_description` (not used)
- ❌ Intent's `focus_areas` (not used)

## Gap Analysis

**What's Missing:**
The generate route should:
1. Fetch the intent record via `intent_id`
2. Include `user_description` in the prompt context
3. Use `focus_areas` to prioritize analysis

**Current Workaround:**
- Intent is captured but only stored
- Story title includes truncated intent (line 338 in new/page.tsx)
- Expertise level is passed separately

**Impact:**
- Stories don't fully reflect user's specific goals
- Focus areas captured in chat aren't used for prioritization
- Feature works but isn't fully leveraged

## Recommendation

**For v1.1 Milestone**: This gap is acceptable because:
1. Core intent capture flow works
2. Narrative style and expertise ARE applied
3. User can describe intent which influences title
4. Full integration can be enhanced in 01-06

**Enhancement for Plan 01-06:**
Add intent data to generation prompt context.

## Next Plan

Proceed to **01-06-PLAN.md**: Integration (with intent enhancement)

## Commit

No changes yet - gap identified for 01-06 implementation.
