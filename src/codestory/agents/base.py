"""Base classes for the Code Story agent framework.

Provides:
- Skill: Base class for tool collections
- @skill decorator: Automatic tool registration from type hints
- Agent: Claude-powered agent with multi-turn conversations
- Orchestrator: 4-stage pipeline coordinator
"""

import inspect
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
from typing import Any, Callable, TypeVar, Generic

from anthropic import Anthropic


# ============================================================================
# Skill Framework
# ============================================================================


@dataclass
class ToolDefinition:
    """Definition of a tool that can be used by Claude."""

    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[..., Any]


@dataclass
class ToolResult:
    """Result from executing a tool."""

    success: bool
    data: Any = None
    error: str | None = None


def skill(
    name: str | None = None,
    description: str | None = None,
) -> Callable:
    """Decorator to register a method as a skill/tool.

    Usage:
        @skill(description="Fetch repository structure from GitHub")
        async def fetch_repo_tree(self, repo_url: str) -> dict:
            ...
    """

    def decorator(func: Callable) -> Callable:
        # Extract parameter schema from type hints
        hints = func.__annotations__
        sig = inspect.signature(func)

        parameters = {"type": "object", "properties": {}, "required": []}

        for param_name, param in sig.parameters.items():
            if param_name in ("self", "return"):
                continue

            param_type = hints.get(param_name, str)
            json_type = _python_type_to_json(param_type)

            parameters["properties"][param_name] = {
                "type": json_type,
                "description": f"Parameter: {param_name}",
            }

            if param.default is inspect.Parameter.empty:
                parameters["required"].append(param_name)

        # Store metadata on function
        func._skill_meta = {
            "name": name or func.__name__,
            "description": description or func.__doc__ or "",
            "parameters": parameters,
        }

        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        wrapper._skill_meta = func._skill_meta
        return wrapper

    return decorator


def _python_type_to_json(py_type: type) -> str:
    """Convert Python type hint to JSON schema type."""
    type_map = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
    }
    # Handle Optional, Union, etc. by getting origin
    origin = getattr(py_type, "__origin__", None)
    if origin is not None:
        py_type = origin
    return type_map.get(py_type, "string")


class Skill(ABC):
    """Base class for skill collections.

    Skills are groups of related tools that an agent can use.
    Each method decorated with @skill becomes a tool available to Claude.
    """

    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}
        self._register_tools()

    def _register_tools(self) -> None:
        """Automatically register all @skill decorated methods."""
        for name in dir(self):
            if name.startswith("_"):
                continue
            method = getattr(self, name)
            if hasattr(method, "_skill_meta"):
                meta = method._skill_meta
                self._tools[meta["name"]] = ToolDefinition(
                    name=meta["name"],
                    description=meta["description"],
                    parameters=meta["parameters"],
                    handler=method,
                )

    def get_tools(self) -> list[ToolDefinition]:
        """Return all registered tools."""
        return list(self._tools.values())

    async def execute(self, tool_name: str, **kwargs) -> ToolResult:
        """Execute a tool by name."""
        if tool_name not in self._tools:
            return ToolResult(success=False, error=f"Unknown tool: {tool_name}")

        try:
            tool = self._tools[tool_name]
            result = await tool.handler(**kwargs)
            return ToolResult(success=True, data=result)
        except Exception as e:
            return ToolResult(success=False, error=str(e))


# ============================================================================
# Agent Framework
# ============================================================================


@dataclass
class AgentConfig:
    """Configuration for an agent."""

    name: str
    description: str
    system_prompt: str
    model: str = "claude-opus-4-5-20251101"
    max_tokens: int = 8192
    temperature: float = 0.7
    effort: str = "high"  # Opus 4.5 effort parameter


@dataclass
class AgentMessage:
    """A message in an agent conversation."""

    role: str  # "user", "assistant"
    content: str
    tool_calls: list[dict] | None = None
    tool_results: list[dict] | None = None


@dataclass
class AgentResponse:
    """Response from an agent."""

    content: str
    tool_calls: list[dict] = field(default_factory=list)
    stop_reason: str | None = None
    usage: dict[str, int] = field(default_factory=dict)


class Agent(ABC):
    """Base class for Claude-powered agents.

    Each agent has:
    - A system prompt defining its role
    - A set of skills (tools) it can use
    - Configuration for the Claude model
    """

    def __init__(
        self,
        config: AgentConfig,
        skills: list[Skill] | None = None,
    ):
        self.config = config
        self.skills = skills or []
        self.conversation: list[AgentMessage] = []
        self.client = Anthropic()

    def add_skill(self, skill: Skill) -> None:
        """Add a skill to the agent."""
        self.skills.append(skill)

    def get_all_tools(self) -> list[dict]:
        """Get all tools from all skills in Claude tool format."""
        tools = []
        for skill in self.skills:
            for tool_def in skill.get_tools():
                tools.append(
                    {
                        "name": tool_def.name,
                        "description": tool_def.description,
                        "input_schema": {
                            "type": "object",
                            "properties": tool_def.parameters.get("properties", {}),
                            "required": tool_def.parameters.get("required", []),
                        },
                    }
                )
        return tools

    async def run(self, user_message: str) -> AgentResponse:
        """Run the agent with a user message.

        Executes multi-turn conversation with tool use until Claude stops.
        """
        # Add user message to conversation
        self.conversation.append(AgentMessage(role="user", content=user_message))

        # Build messages for Claude API
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in self.conversation
        ]

        # Get tools and build request
        tools = self.get_all_tools()

        # Call Claude API
        response = self.client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=self.config.system_prompt,
            tools=tools if tools else None,
            messages=messages,
            extra_headers={"anthropic-beta": "interop-2024-12-20"},
            **{"timeout": 60},  # Add timeout for safety
        )

        # Process response
        content_text = ""
        new_tool_calls = []

        for block in response.content:
            if hasattr(block, "text"):
                content_text += block.text
            elif block.type == "tool_use":
                new_tool_calls.append(
                    {
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )

        # Handle tool calls if present
        if new_tool_calls and response.stop_reason == "tool_use":
            # Execute tools
            tool_results = await self._execute_tools(new_tool_calls)

            # Add assistant response with tool calls
            self.conversation.append(
                AgentMessage(
                    role="assistant",
                    content=content_text,
                    tool_calls=new_tool_calls,
                )
            )

            # Add tool results and continue
            return await self._continue_with_tools(tool_results)

        # Final response
        self.conversation.append(AgentMessage(role="assistant", content=content_text))

        return AgentResponse(
            content=content_text,
            stop_reason=response.stop_reason,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        )

    async def _execute_tools(self, tool_calls: list[dict]) -> list[dict]:
        """Execute a list of tool calls and return results."""
        results = []

        for call in tool_calls:
            tool_name = call["name"]
            tool_input = call["input"]

            # Find and execute the tool
            for skill in self.skills:
                if tool_name in [t.name for t in skill.get_tools()]:
                    result = await skill.execute(tool_name, **tool_input)
                    results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": call["id"],
                            "content": json.dumps(
                                {
                                    "success": result.success,
                                    "data": result.data,
                                    "error": result.error,
                                }
                            ),
                        }
                    )
                    break
            else:
                # Tool not found
                results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": call["id"],
                        "content": json.dumps({"success": False, "error": f"Unknown tool: {tool_name}"}),
                    }
                )

        return results

    async def _continue_with_tools(self, tool_results: list[dict]) -> AgentResponse:
        """Continue conversation after tool execution."""
        # Add tool results to messages
        self.conversation[-1].tool_results = tool_results

        # Rebuild messages for Claude
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in self.conversation
        ]

        # Add tool results to last assistant message
        messages[-1] = {
            "role": "assistant",
            "content": [
                {"type": "text", "text": self.conversation[-1].content},
                *(
                    [
                        {"type": "tool_use", "id": call["id"], "name": call["name"], "input": call["input"]}
                        for call in self.conversation[-1].tool_calls or []
                    ]
                ),
            ],
        }

        # Add tool results as user message
        messages.append(
            {
                "role": "user",
                "content": tool_results,
            }
        )

        # Continue conversation
        response = self.client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=self.config.system_prompt,
            tools=self.get_all_tools() or None,
            messages=messages,
            extra_headers={"anthropic-beta": "interop-2024-12-20"},
        )

        # Process response
        content_text = ""
        new_tool_calls = []

        for block in response.content:
            if hasattr(block, "text"):
                content_text += block.text
            elif block.type == "tool_use":
                new_tool_calls.append(
                    {
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )

        # Recursive tool execution
        if new_tool_calls and response.stop_reason == "tool_use":
            self.conversation.append(
                AgentMessage(
                    role="assistant",
                    content=content_text,
                    tool_calls=new_tool_calls,
                )
            )
            new_results = await self._execute_tools(new_tool_calls)
            return await self._continue_with_tools(new_results)

        # Final response
        self.conversation.append(AgentMessage(role="assistant", content=content_text))

        return AgentResponse(
            content=content_text,
            stop_reason=response.stop_reason,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        )

    def clear_conversation(self) -> None:
        """Clear the conversation history."""
        self.conversation = []


# ============================================================================
# Pipeline Orchestration
# ============================================================================


class PipelineStage(str, Enum):
    """Stages in the story generation pipeline."""

    INTENT = "intent"
    ANALYSIS = "analysis"
    NARRATIVE = "narrative"
    SYNTHESIS = "synthesis"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class PipelineState:
    """State of the story generation pipeline."""

    stage: PipelineStage
    intent_result: dict | None = None
    analysis_result: dict | None = None
    narrative_result: dict | None = None
    synthesis_result: dict | None = None
    error: str | None = None


class Orchestrator:
    """Orchestrates the 4-agent pipeline for story generation.

    Pipeline flow:
    1. Intent Agent - Understand user's learning goals
    2. Repo Analyzer - Analyze the codebase
    3. Story Architect - Generate narrative script
    4. Voice Director - Synthesize audio
    """

    def __init__(
        self,
        intent_agent: Agent | None = None,
        analyzer_agent: Agent | None = None,
        architect_agent: Agent | None = None,
        voice_agent: Agent | None = None,
    ):
        self.intent_agent = intent_agent
        self.analyzer_agent = analyzer_agent
        self.architect_agent = architect_agent
        self.voice_agent = voice_agent
        self.state = PipelineState(stage=PipelineStage.INTENT)

    async def run_pipeline(
        self,
        repo_url: str,
        user_intent: str,
        narrative_style: str = "documentary",
        on_progress: Callable[[PipelineStage, str], None] | None = None,
    ) -> PipelineState:
        """Run the full story generation pipeline.

        Args:
            repo_url: GitHub repository URL
            user_intent: User's learning goals/intent
            narrative_style: Style of narrative (fiction, documentary, etc.)
            on_progress: Optional callback for progress updates

        Returns:
            Final pipeline state with all results
        """
        try:
            # Stage 1: Intent Analysis
            self.state.stage = PipelineStage.INTENT
            if on_progress:
                on_progress(PipelineStage.INTENT, "Understanding your learning goals...")

            if self.intent_agent:
                intent_response = await self.intent_agent.run(
                    f"Repository: {repo_url}\nUser's learning goals: {user_intent}"
                )
                self.state.intent_result = {
                    "content": intent_response.content,
                    "usage": intent_response.usage,
                }

            # Stage 2: Repository Analysis
            self.state.stage = PipelineStage.ANALYSIS
            if on_progress:
                on_progress(PipelineStage.ANALYSIS, "Analyzing the codebase...")

            if self.analyzer_agent:
                analysis_prompt = f"Analyze repository: {repo_url}"
                if self.state.intent_result:
                    analysis_prompt += f"\nFocus areas from intent: {self.state.intent_result['content']}"

                analysis_response = await self.analyzer_agent.run(analysis_prompt)
                self.state.analysis_result = {
                    "content": analysis_response.content,
                    "usage": analysis_response.usage,
                }

            # Stage 3: Narrative Generation
            self.state.stage = PipelineStage.NARRATIVE
            if on_progress:
                on_progress(PipelineStage.NARRATIVE, "Crafting your story...")

            if self.architect_agent:
                narrative_prompt = f"Generate {narrative_style} narrative for repository analysis."
                if self.state.analysis_result:
                    narrative_prompt += f"\nAnalysis: {self.state.analysis_result['content']}"
                if self.state.intent_result:
                    narrative_prompt += f"\nIntent: {self.state.intent_result['content']}"

                narrative_response = await self.architect_agent.run(narrative_prompt)
                self.state.narrative_result = {
                    "content": narrative_response.content,
                    "usage": narrative_response.usage,
                }

            # Stage 4: Voice Synthesis
            self.state.stage = PipelineStage.SYNTHESIS
            if on_progress:
                on_progress(PipelineStage.SYNTHESIS, "Generating audio...")

            if self.voice_agent and self.state.narrative_result:
                synthesis_response = await self.voice_agent.run(
                    f"Synthesize audio for script: {self.state.narrative_result['content']}"
                )
                self.state.synthesis_result = {
                    "content": synthesis_response.content,
                    "usage": synthesis_response.usage,
                }

            # Complete
            self.state.stage = PipelineStage.COMPLETE
            if on_progress:
                on_progress(PipelineStage.COMPLETE, "Story complete!")

        except Exception as e:
            self.state.stage = PipelineStage.FAILED
            self.state.error = str(e)
            if on_progress:
                on_progress(PipelineStage.FAILED, f"Error: {str(e)}")

        return self.state

    def get_state(self) -> PipelineState:
        """Get current pipeline state."""
        return self.state

    def reset(self) -> None:
        """Reset pipeline state."""
        self.state = PipelineState(stage=PipelineStage.INTENT)
