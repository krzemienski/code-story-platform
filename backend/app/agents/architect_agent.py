"""Story Architect Agent - Creates narrative scripts from code analysis."""

from typing import Any

from app.agents.base import BaseAgent
from app.models.processing_log import LogLevel


class ArchitectAgent(BaseAgent):
    """
    Story Architect Agent creates compelling narrative scripts.

    Responsibilities:
    - Transform code analysis into an engaging story
    - Structure content for audio consumption
    - Match the requested style (documentary, tutorial, etc.)
    - Create chapters and segment the content
    - Ensure duration target is met
    """

    @property
    def agent_name(self) -> str:
        return "Architect"

    @property
    def system_prompt(self) -> str:
        return """You are the Story Architect for Code Story, a master storyteller who transforms code into engaging audio narratives.

Your task is to create a script for an audio story about a codebase. The script should:
1. Be written for spoken narration (avoid code blocks, use natural language)
2. Match the requested style (documentary, tutorial, podcast, fiction, technical)
3. Be structured with clear chapters or segments
4. Fit the target duration (approximately 150 words per minute of speech)
5. Be educational while remaining engaging

Style guidelines:
- DOCUMENTARY: Objective, third-person narration like a nature documentary
- TUTORIAL: Second-person, instructional tone with clear steps
- PODCAST: Conversational, casual, like explaining to a friend
- FICTION: Creative storytelling with the code as characters/plot
- TECHNICAL: Precise, detailed technical explanation

Output your script as JSON with the following structure:
{
    "title": "Story title",
    "chapters": [
        {
            "title": "Chapter title",
            "content": "Full chapter script text...",
            "duration_estimate": "X minutes"
        }
    ],
    "total_duration_estimate": "X minutes",
    "word_count": 1234,
    "style": "documentary|tutorial|podcast|fiction|technical"
}

Write naturally flowing prose suitable for audio narration. Avoid bullet points or lists."""

    async def run(
        self,
        analysis: dict[str, Any],
        style: str,
        duration_minutes: int,
        focus_areas: list[str],
        technical_depth: str,
        repo_url: str,
    ) -> dict[str, Any]:
        """
        Create a narrative script from the code analysis.

        Returns the script structured into chapters.
        """
        await self.log(
            "Crafting story narrative",
            details={"style": style, "duration": duration_minutes},
        )

        # Calculate target word count (150 words per minute)
        target_words = duration_minutes * 150

        user_message = f"""Create a {style} style audio story about this codebase.

Repository: {repo_url}
Target Duration: {duration_minutes} minutes (approximately {target_words} words)
Technical Depth: {technical_depth}
Focus Areas: {', '.join(focus_areas) if focus_areas else 'General overview'}

Code Analysis:
{self._format_analysis(analysis)}

Create an engaging narrative script that would make this codebase come alive for listeners.
The script should be ready for voice synthesis - write it as spoken prose."""

        response = self.call_claude(user_message, use_extended_thinking=True)

        await self.log(
            "Story script created",
            level=LogLevel.SUCCESS,
        )

        # Parse the JSON response
        import json
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                script_data = json.loads(response[start:end])
            else:
                # Use the raw response as content
                script_data = self._create_default_script(response, style)
        except json.JSONDecodeError:
            script_data = self._create_default_script(response, style)

        # Combine chapters into full script
        full_script = self._combine_chapters(script_data.get("chapters", []))

        return {
            "script": full_script,
            "chapters": script_data.get("chapters", []),
            "title": script_data.get("title", "Code Story"),
            "word_count": len(full_script.split()),
            "style": style,
        }

    def _format_analysis(self, analysis: dict[str, Any]) -> str:
        """Format the analysis for the prompt."""
        parts = []

        if "summary" in analysis:
            parts.append(f"Summary: {analysis['summary']}")

        if "architecture" in analysis:
            arch = analysis["architecture"]
            parts.append(f"Architecture: {arch.get('pattern', 'Unknown')} - {arch.get('description', '')}")

        if "technologies" in analysis:
            parts.append(f"Technologies: {', '.join(analysis['technologies'])}")

        if "key_files" in analysis:
            files = analysis["key_files"][:10]  # Limit to top 10
            file_list = "\n".join([
                f"- {f['path']}: {f['purpose']}"
                for f in files
            ])
            parts.append(f"Key Files:\n{file_list}")

        if "suggested_story_points" in analysis:
            points = analysis["suggested_story_points"]
            point_list = "\n".join([
                f"- {p['topic']}: {p['description']}"
                for p in points
            ])
            parts.append(f"Story Points:\n{point_list}")

        return "\n\n".join(parts)

    def _combine_chapters(self, chapters: list[dict]) -> str:
        """Combine chapter contents into a single script."""
        parts = []
        for chapter in chapters:
            content = chapter.get("content", "")
            if content:
                parts.append(content)
        return "\n\n".join(parts)

    def _create_default_script(self, raw_response: str, style: str) -> dict:
        """Create a default script structure from raw response."""
        # Clean up the response to use as content
        content = raw_response.strip()

        # Remove any JSON-like formatting
        if content.startswith("```"):
            content = content.split("```")[1] if "```" in content else content

        return {
            "title": "Code Story",
            "chapters": [
                {
                    "title": "Introduction",
                    "content": content,
                    "duration_estimate": "unknown",
                }
            ],
            "total_duration_estimate": "unknown",
            "word_count": len(content.split()),
            "style": style,
        }
