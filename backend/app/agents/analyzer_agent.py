"""Analyzer Agent - Analyzes repository structure and content using RepoMix."""

import subprocess
import tempfile
import os
from typing import Any

from app.agents.base import BaseAgent
from app.models.processing_log import LogLevel


class AnalyzerAgent(BaseAgent):
    """
    Analyzer Agent examines the repository using RepoMix.

    Responsibilities:
    - Clone and analyze the repository
    - Extract key architectural patterns
    - Identify important files and their relationships
    - Create a structured analysis for the Story Architect
    """

    @property
    def agent_name(self) -> str:
        return "Analyzer"

    @property
    def system_prompt(self) -> str:
        return """You are the Analyzer Agent for Code Story, responsible for understanding codebases.

Given a repository analysis from RepoMix, your tasks are:
1. Identify the overall architecture and design patterns
2. Find the most important files and their relationships
3. Understand the data flow and key abstractions
4. Note interesting implementation details worth discussing
5. Identify the technologies and frameworks used

Output your analysis as JSON with the following structure:
{
    "architecture": {
        "pattern": "monolith|microservices|serverless|etc",
        "description": "Brief architecture description"
    },
    "technologies": ["tech1", "tech2", ...],
    "key_files": [
        {"path": "file/path", "purpose": "what it does", "importance": "high|medium|low"}
    ],
    "data_flow": "Description of how data flows through the system",
    "interesting_patterns": ["pattern1", "pattern2", ...],
    "suggested_story_points": [
        {"topic": "topic name", "description": "what to discuss", "duration_estimate": "X minutes"}
    ],
    "complexity_score": 1-10,
    "summary": "One paragraph summary of the codebase"
}

Be thorough but focus on what would be interesting to explain in an audio story."""

    async def run(
        self,
        repo_url: str,
        focus_areas: list[str],
        technical_depth: str,
        style: str,
        duration_minutes: int,
    ) -> dict[str, Any]:
        """
        Analyze the repository and create a structured analysis.

        Uses RepoMix to pack the repository, then analyzes with Claude.
        """
        await self.log(
            "Starting repository analysis",
            details={"repo_url": repo_url},
        )

        # Run RepoMix to analyze the repository
        repomix_output = await self._run_repomix(repo_url)

        await self.log(
            "RepoMix analysis complete",
            details={"output_length": len(repomix_output)},
        )

        # Analyze with Claude
        user_message = f"""Analyze this repository for creating a {style} style code story.

Repository: {repo_url}
Focus Areas: {', '.join(focus_areas) if focus_areas else 'General overview'}
Technical Depth: {technical_depth}
Target Duration: {duration_minutes} minutes

RepoMix Analysis:
{repomix_output[:50000]}  # Limit to avoid token overflow

Provide a structured analysis focusing on the most interesting and educational aspects."""

        response = self.call_claude(user_message, use_extended_thinking=True)

        await self.log(
            "Repository analysis complete",
            level=LogLevel.SUCCESS,
        )

        # Parse the JSON response
        import json
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                analysis = json.loads(response[start:end])
            else:
                analysis = self._default_analysis()
        except json.JSONDecodeError:
            analysis = self._default_analysis()

        return {
            "analysis": analysis,
            "raw_repomix": repomix_output[:20000],  # Keep some context
            "repo_url": repo_url,
            "focus_areas": focus_areas,
            "technical_depth": technical_depth,
            "style": style,
            "duration_minutes": duration_minutes,
        }

    async def _run_repomix(self, repo_url: str) -> str:
        """Run RepoMix on the repository."""
        try:
            # Create a temporary directory for output
            with tempfile.TemporaryDirectory() as temp_dir:
                output_file = os.path.join(temp_dir, "repomix-output.txt")

                # Run repomix command
                result = subprocess.run(
                    [
                        "npx",
                        "repomix",
                        "--remote", repo_url,
                        "--output", output_file,
                        "--style", "plain",
                        "--remove-empty-lines",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,  # 2 minute timeout
                )

                if result.returncode != 0:
                    await self.log(
                        f"RepoMix warning: {result.stderr}",
                        level=LogLevel.WARNING,
                    )

                # Read the output file
                if os.path.exists(output_file):
                    with open(output_file, "r") as f:
                        return f.read()
                else:
                    return f"RepoMix output not found. stderr: {result.stderr}"

        except subprocess.TimeoutExpired:
            await self.log(
                "RepoMix timed out after 2 minutes",
                level=LogLevel.WARNING,
            )
            return "Repository analysis timed out. Proceeding with limited information."
        except Exception as e:
            await self.log(
                f"RepoMix error: {str(e)}",
                level=LogLevel.ERROR,
            )
            return f"Repository analysis failed: {str(e)}"

    def _default_analysis(self) -> dict[str, Any]:
        """Return a default analysis structure."""
        return {
            "architecture": {
                "pattern": "unknown",
                "description": "Could not determine architecture",
            },
            "technologies": [],
            "key_files": [],
            "data_flow": "Unknown",
            "interesting_patterns": [],
            "suggested_story_points": [],
            "complexity_score": 5,
            "summary": "Analysis could not be completed",
        }
