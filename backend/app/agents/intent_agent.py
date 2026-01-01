"""Intent Agent - Validates and refines user intent for story generation."""

from typing import Any

from app.agents.base import BaseAgent
from app.models.processing_log import LogLevel


class IntentAgent(BaseAgent):
    """
    Intent Agent validates and refines the user's story generation request.

    Responsibilities:
    - Validate repository URL accessibility
    - Refine focus areas based on common patterns
    - Suggest appropriate technical depth
    - Estimate feasibility of duration target
    """

    @property
    def agent_name(self) -> str:
        return "Intent"

    @property
    def system_prompt(self) -> str:
        return """You are the Intent Agent for Code Story, responsible for validating and refining story generation requests.

Your tasks:
1. Analyze the repository URL and focus areas requested
2. Validate that the request is reasonable and achievable
3. Suggest refined focus areas that would make a coherent story
4. Estimate if the duration target is achievable given the scope

Output your analysis as JSON with the following structure:
{
    "valid": true/false,
    "refined_focus_areas": ["area1", "area2", ...],
    "suggested_technical_depth": "beginner|intermediate|advanced",
    "duration_feasibility": "achievable|ambitious|conservative",
    "story_angle": "A brief description of the recommended story angle",
    "warnings": ["any warnings or suggestions"],
    "ready_for_analysis": true/false
}

Be concise and practical. Focus on creating an engaging, educational story."""

    async def run(
        self,
        repo_url: str,
        style: str,
        duration_minutes: int,
        focus_areas: list[str],
        technical_depth: str,
    ) -> dict[str, Any]:
        """
        Validate and refine the story generation intent.

        Returns refined parameters for the analyzer agent.
        """
        await self.log(
            "Validating story generation request",
            details={"repo_url": repo_url, "style": style},
        )

        user_message = f"""Please analyze this story generation request:

Repository: {repo_url}
Style: {style}
Target Duration: {duration_minutes} minutes
Focus Areas: {', '.join(focus_areas) if focus_areas else 'Not specified'}
Technical Depth: {technical_depth}

Validate this request and provide refined recommendations."""

        response = self.call_claude(user_message, use_extended_thinking=True)

        await self.log(
            "Intent validation complete",
            level=LogLevel.SUCCESS,
            details={"response_length": len(response)},
        )

        # Parse the JSON response
        import json
        try:
            # Find JSON in response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(response[start:end])
            else:
                result = {
                    "valid": True,
                    "refined_focus_areas": focus_areas,
                    "suggested_technical_depth": technical_depth,
                    "duration_feasibility": "achievable",
                    "story_angle": "General codebase overview",
                    "warnings": [],
                    "ready_for_analysis": True,
                }
        except json.JSONDecodeError:
            result = {
                "valid": True,
                "refined_focus_areas": focus_areas,
                "suggested_technical_depth": technical_depth,
                "duration_feasibility": "achievable",
                "story_angle": "General codebase overview",
                "warnings": ["Could not parse intent analysis"],
                "ready_for_analysis": True,
            }

        return {
            "intent": result,
            "repo_url": repo_url,
            "style": style,
            "duration_minutes": duration_minutes,
            "focus_areas": result.get("refined_focus_areas", focus_areas),
            "technical_depth": result.get("suggested_technical_depth", technical_depth),
        }
