"""Voice Director Agent - Prepares scripts for optimal voice synthesis."""

from typing import Any

from app.agents.base import BaseAgent
from app.models.processing_log import LogLevel


class VoiceDirectorAgent(BaseAgent):
    """
    Voice Director Agent optimizes scripts for voice synthesis.

    Responsibilities:
    - Add pronunciation hints for technical terms
    - Insert appropriate pauses and emphasis markers
    - Ensure text flows naturally when spoken
    - Split content into optimal chunks for synthesis
    """

    @property
    def agent_name(self) -> str:
        return "Voice Director"

    @property
    def system_prompt(self) -> str:
        return """You are the Voice Director for Code Story, optimizing scripts for natural speech synthesis.

Your task is to prepare a script for ElevenLabs voice synthesis by:
1. Spelling out abbreviations and acronyms (API -> A P I, HTML -> H T M L)
2. Adding natural pauses with ellipses (...) or commas
3. Breaking up long sentences for better pacing
4. Adding pronunciation hints for technical terms in parentheses
5. Ensuring the text sounds natural when read aloud
6. Removing any markdown formatting or special characters

Output the optimized script as plain text, ready for voice synthesis.
Do NOT include any JSON formatting or code blocks - just the plain script text.

Example transformations:
- "The API endpoint" -> "The A P I endpoint"
- "Using React.js" -> "Using React dot J S"
- "The ./src directory" -> "The source directory"
- "npm install" -> "N P M install"
- "async/await" -> "async await"

Keep the meaning and flow intact while making it speech-friendly."""

    async def run(
        self,
        script: str,
        chapters: list[dict],
        style: str,
    ) -> dict[str, Any]:
        """
        Optimize the script for voice synthesis.

        Returns the optimized script ready for ElevenLabs.
        """
        await self.log(
            "Optimizing script for voice synthesis",
            details={"script_length": len(script)},
        )

        user_message = f"""Optimize this {style} script for voice synthesis:

{script}

Make it sound natural when spoken aloud. Spell out technical abbreviations.
Return ONLY the optimized script text, no JSON or formatting."""

        optimized_script = self.call_claude(user_message, use_extended_thinking=False)

        # Clean up any remaining formatting
        optimized_script = self._clean_for_synthesis(optimized_script)

        await self.log(
            "Voice optimization complete",
            level=LogLevel.SUCCESS,
            details={"optimized_length": len(optimized_script)},
        )

        # Also optimize chapter contents
        optimized_chapters = []
        for chapter in chapters:
            optimized_chapters.append({
                "title": chapter.get("title", ""),
                "content": self._clean_for_synthesis(chapter.get("content", "")),
                "duration_estimate": chapter.get("duration_estimate", ""),
            })

        return {
            "script": optimized_script,
            "chapters": optimized_chapters,
            "word_count": len(optimized_script.split()),
        }

    def _clean_for_synthesis(self, text: str) -> str:
        """Clean text for voice synthesis."""
        # Remove markdown formatting
        text = text.replace("**", "")
        text = text.replace("__", "")
        text = text.replace("```", "")
        text = text.replace("`", "")
        text = text.replace("#", "")
        text = text.replace("*", "")

        # Remove URLs (they sound terrible when read)
        import re
        text = re.sub(r'https?://\S+', '', text)

        # Remove file paths that look like code
        text = re.sub(r'\./\S+', '', text)

        # Remove any remaining special characters
        text = text.replace("  ", " ")  # Double spaces
        text = text.replace("\n\n\n", "\n\n")  # Triple newlines

        return text.strip()
