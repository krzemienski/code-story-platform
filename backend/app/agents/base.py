"""Base agent class with Claude Opus 4.5 extended thinking."""

from typing import Any
from abc import ABC, abstractmethod

from anthropic import Anthropic

from app.config import get_settings
from app.models.processing_log import LogLevel
from app.services.supabase import SupabaseService


class BaseAgent(ABC):
    """Base class for all pipeline agents using Claude Opus 4.5."""

    def __init__(
        self,
        story_id: str,
        supabase: SupabaseService,
    ):
        self.story_id = story_id
        self.supabase = supabase
        self.settings = get_settings()
        self.client = Anthropic(api_key=self.settings.anthropic_api_key)

    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Return the agent name for logging."""
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass

    async def log(
        self,
        action: str,
        level: LogLevel = LogLevel.INFO,
        details: dict[str, Any] | None = None,
    ) -> None:
        """Log an action to the processing log."""
        await self.supabase.insert_processing_log(
            story_id=self.story_id,
            agent_name=self.agent_name,
            action=action,
            level=level,
            details=details,
        )

    def call_claude(
        self,
        user_message: str,
        use_extended_thinking: bool = True,
    ) -> str:
        """
        Call Claude Opus 4.5 with optional extended thinking.

        Args:
            user_message: The user message to send
            use_extended_thinking: Whether to enable extended thinking

        Returns:
            The assistant's text response
        """
        if use_extended_thinking:
            # Use extended thinking with streaming for complex reasoning
            response = self.client.messages.create(
                model=self.settings.claude_model,
                max_tokens=16000,
                thinking={
                    "type": "enabled",
                    "budget_tokens": self.settings.claude_thinking_budget,
                },
                messages=[
                    {"role": "user", "content": user_message},
                ],
                system=self.system_prompt,
                betas=["interleaved-thinking-2025-05-14"],
            )
        else:
            # Standard call without extended thinking
            response = self.client.messages.create(
                model=self.settings.claude_model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": user_message},
                ],
                system=self.system_prompt,
            )

        # Extract text from response
        text_blocks = [
            block.text
            for block in response.content
            if hasattr(block, "text")
        ]
        return "\n".join(text_blocks)

    @abstractmethod
    async def run(self, **kwargs) -> dict[str, Any]:
        """Run the agent's task."""
        pass
