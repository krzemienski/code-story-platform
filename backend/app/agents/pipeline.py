"""Agent pipeline orchestration for story generation."""

from typing import Any

from app.agents.intent_agent import IntentAgent
from app.agents.analyzer_agent import AnalyzerAgent
from app.agents.architect_agent import ArchitectAgent
from app.agents.voice_agent import VoiceDirectorAgent
from app.models.story import StoryStatus
from app.models.processing_log import LogLevel
from app.services.supabase import SupabaseService


async def run_agent_pipeline(
    story_id: str,
    repo_url: str,
    style: str,
    duration_minutes: int,
    focus_areas: list[str],
    technical_depth: str,
    supabase: SupabaseService,
) -> dict[str, Any]:
    """
    Run the 4-agent pipeline for story generation.

    Pipeline stages:
    1. Intent Agent (5-15%) - Validate and refine request
    2. Analyzer Agent (15-50%) - Analyze repository with RepoMix
    3. Architect Agent (50-70%) - Create narrative script
    4. Voice Director (70-75%) - Optimize for synthesis

    Args:
        story_id: Unique story identifier
        repo_url: GitHub repository URL
        style: Narrative style
        duration_minutes: Target duration
        focus_areas: List of focus areas
        technical_depth: Technical depth level
        supabase: Supabase service instance

    Returns:
        Dictionary with script and chapters
    """
    # Stage 1: Intent Agent (5-15%)
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.ANALYZING,
        progress=5,
    )

    intent_agent = IntentAgent(story_id, supabase)
    intent_result = await intent_agent.run(
        repo_url=repo_url,
        style=style,
        duration_minutes=duration_minutes,
        focus_areas=focus_areas,
        technical_depth=technical_depth,
    )

    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.ANALYZING,
        progress=15,
    )

    # Stage 2: Analyzer Agent (15-50%)
    analyzer_agent = AnalyzerAgent(story_id, supabase)
    analysis_result = await analyzer_agent.run(
        repo_url=repo_url,
        focus_areas=intent_result["focus_areas"],
        technical_depth=intent_result["technical_depth"],
        style=style,
        duration_minutes=duration_minutes,
    )

    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.GENERATING,
        progress=50,
    )

    # Stage 3: Architect Agent (50-70%)
    architect_agent = ArchitectAgent(story_id, supabase)
    script_result = await architect_agent.run(
        analysis=analysis_result["analysis"],
        style=style,
        duration_minutes=duration_minutes,
        focus_areas=intent_result["focus_areas"],
        technical_depth=intent_result["technical_depth"],
        repo_url=repo_url,
    )

    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.GENERATING,
        progress=70,
    )

    # Stage 4: Voice Director (70-75%)
    voice_agent = VoiceDirectorAgent(story_id, supabase)
    voice_result = await voice_agent.run(
        script=script_result["script"],
        chapters=script_result["chapters"],
        style=style,
    )

    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.SYNTHESIZING,
        progress=75,
    )

    return {
        "script": voice_result["script"],
        "chapters": voice_result["chapters"],
        "title": script_result.get("title", "Code Story"),
        "word_count": voice_result["word_count"],
        "intent": intent_result.get("intent", {}),
        "analysis": analysis_result.get("analysis", {}),
    }
