"""Agent framework for Code Story.

Agents are Claude-powered entities that use skills (tools) to perform tasks.
The framework includes:
- Skill: Base class for tool collections
- Agent: Base class for Claude-powered agents
- Orchestrator: Coordinates the 4-agent pipeline

Pipeline: Intent Agent → Repo Analyzer → Story Architect → Voice Director
"""

from .base import (
    Skill,
    skill,
    ToolDefinition,
    ToolResult,
    Agent,
    AgentConfig,
    AgentMessage,
    AgentResponse,
    Orchestrator,
    PipelineStage,
    PipelineState,
)

__all__ = [
    "Skill",
    "skill",
    "ToolDefinition",
    "ToolResult",
    "Agent",
    "AgentConfig",
    "AgentMessage",
    "AgentResponse",
    "Orchestrator",
    "PipelineStage",
    "PipelineState",
]
