"""WebSocket handler for real-time story progress updates."""

import asyncio
import json
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect
from supabase import Client

from app.services.supabase import get_supabase_service


class ConnectionManager:
    """Manages WebSocket connections for story progress updates."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, story_id: str) -> None:
        """Accept a new WebSocket connection for a story."""
        await websocket.accept()
        if story_id not in self.active_connections:
            self.active_connections[story_id] = []
        self.active_connections[story_id].append(websocket)

    def disconnect(self, websocket: WebSocket, story_id: str) -> None:
        """Remove a WebSocket connection."""
        if story_id in self.active_connections:
            if websocket in self.active_connections[story_id]:
                self.active_connections[story_id].remove(websocket)
            if not self.active_connections[story_id]:
                del self.active_connections[story_id]

    async def send_message(self, story_id: str, message: dict[str, Any]) -> None:
        """Send a message to all connections for a story."""
        if story_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[story_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)

            # Clean up dead connections
            for conn in dead_connections:
                self.disconnect(conn, story_id)

    async def broadcast_log(
        self,
        story_id: str,
        agent_name: str,
        action: str,
        level: str = "info",
        details: dict[str, Any] | None = None,
    ) -> None:
        """Broadcast a processing log to all connected clients."""
        message = {
            "type": "log",
            "data": {
                "agentName": agent_name,
                "action": action,
                "level": level,
                "details": details or {},
            },
        }
        await self.send_message(story_id, message)

    async def broadcast_status(
        self,
        story_id: str,
        status: str,
        progress: int,
    ) -> None:
        """Broadcast a status update to all connected clients."""
        message = {
            "type": "status",
            "data": {
                "status": status,
                "progress": progress,
            },
        }
        await self.send_message(story_id, message)

    async def broadcast_complete(
        self,
        story_id: str,
        audio_url: str,
        audio_chunks: list[str],
        duration: int,
    ) -> None:
        """Broadcast completion to all connected clients."""
        message = {
            "type": "complete",
            "data": {
                "audioUrl": audio_url,
                "audioChunks": audio_chunks,
                "duration": duration,
            },
        }
        await self.send_message(story_id, message)

    async def broadcast_error(
        self,
        story_id: str,
        error_message: str,
    ) -> None:
        """Broadcast an error to all connected clients."""
        message = {
            "type": "error",
            "data": {
                "message": error_message,
            },
        }
        await self.send_message(story_id, message)


# Global connection manager
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, story_id: str) -> None:
    """
    WebSocket endpoint for story progress updates.

    Clients connect to /ws/stories/{story_id}/progress to receive
    real-time updates about story generation progress.
    """
    await manager.connect(websocket, story_id)

    try:
        # Send initial story status
        supabase = get_supabase_service()
        story = await supabase.get_story(story_id)

        if story:
            await websocket.send_json({
                "type": "status",
                "data": {
                    "status": story["status"],
                    "progress": story.get("progress", 0),
                },
            })

            # Send existing logs
            logs = await supabase.get_processing_logs(story_id)
            for log in logs:
                await websocket.send_json({
                    "type": "log",
                    "data": {
                        "agentName": log["agent_name"],
                        "action": log["action"],
                        "level": log["level"],
                        "details": log.get("details", {}),
                        "timestamp": log["timestamp"],
                    },
                })

        # Keep connection alive and wait for client messages
        while True:
            try:
                # Wait for ping/pong or client disconnect
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0,
                )
                # Handle ping
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send keepalive ping
                try:
                    await websocket.send_text("ping")
                except Exception:
                    break

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, story_id)


def get_connection_manager() -> ConnectionManager:
    """Get the global connection manager."""
    return manager
