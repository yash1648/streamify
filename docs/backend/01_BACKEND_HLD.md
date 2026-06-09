# Backend High-Level Design

---

## Overview

The backend is a stateless Spring Boot application with in-memory room state. It exposes REST endpoints for room management and a WebSocket endpoint for all real-time communication.

---

## Layer Diagram

```
HTTP Requests          WebSocket (STOMP)
      |                        |
      v                        v
┌─────────────────────────────────────────┐
│              Controllers                │
│  RoomController     WebSocketController │
└─────────────────────────────────────────┘
               |
               v
┌─────────────────────────────────────────┐
│                Services                 │
│  RoomService    SyncService             │
│  ChatService    SignalingService        │
│                 PresenceService         │
└─────────────────────────────────────────┘
               |
               v
┌─────────────────────────────────────────┐
│             In-Memory Store             │
│     ConcurrentHashMap<String, Room>     │
└─────────────────────────────────────────┘
```

---

## Controllers

### RoomController

Handles REST API requests.

| Endpoint | Method | Description |
|---|---|---|
| `/rooms` | POST | Create a new room |
| `/rooms/{id}` | GET | Fetch room metadata |
| `/health` | GET | Health check |

### WebSocketController (STOMP Message Handlers)

Handles incoming WebSocket messages from clients.

| Destination | Event Type | Handler |
|---|---|---|
| `/app/room.join` | `JOIN_ROOM` | `PresenceService.join()` |
| `/app/room.leave` | `LEAVE_ROOM` | `PresenceService.leave()` |
| `/app/chat.send` | `SEND_MESSAGE` | `ChatService.broadcast()` |
| `/app/sync.play` | `PLAY` | `SyncService.play()` |
| `/app/sync.pause` | `PAUSE` | `SyncService.pause()` |
| `/app/sync.seek` | `SEEK` | `SyncService.seek()` |
| `/app/sync.url` | `VIDEO_URL_UPDATE` | `SyncService.updateUrl()` |
| `/app/signal` | `OFFER/ANSWER/ICE` | `SignalingService.relay()` |

---

## Services

| Service | Primary Role |
|---|---|
| `RoomService` | Room CRUD, participant management |
| `ChatService` | Message broadcast |
| `SyncService` | Video state management and heartbeat |
| `SignalingService` | WebRTC signal relay |
| `PresenceService` | Join/leave/host transfer logic |

---

## WebSocket Layer

- Protocol: STOMP over SockJS
- Endpoint: `/ws`
- Message broker: Spring Simple Broker
- Broadcast channel: `/topic/room/{roomId}`
- Private channel: `/user/{userId}/queue/...`

---

## Broadcast vs. Private Messaging

| Use Case | Channel |
|---|---|
| Chat message to all | `/topic/room/{id}` |
| Sync heartbeat to all | `/topic/room/{id}` |
| Play/pause/seek to all | `/topic/room/{id}` |
| User joined/left to all | `/topic/room/{id}` |
| Initial sync on join | `/user/{id}/queue/sync` |
| WebRTC OFFER to target | `/user/{targetId}/queue/signal` |
| WebRTC ANSWER to target | `/user/{targetId}/queue/signal` |
| ICE candidate to target | `/user/{targetId}/queue/signal` |

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Room not found | Return 404 |
| Non-host sends sync event | Event ignored |
| Invalid signal target | Silently dropped |
| WebSocket disconnect | `PresenceService.handleDisconnect()` called |
