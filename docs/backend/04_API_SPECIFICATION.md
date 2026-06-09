# API Specification

---

## Overview

The backend exposes a minimal REST API for room management. All real-time communication flows through WebSocket (STOMP) events. This document covers the REST endpoints only; see `03_WEBSOCKET_EVENTS.md` for WebSocket event specifications.

---

## Base URL

**Production:** `https://yourapp.onrender.com`  
**Local:** `http://localhost:8080`

---

## REST Endpoints

### POST /rooms — Create Room

Creates a new watch-party room. The caller becomes the host.

**Request:**

```json
{
  "userId": "user-001",
  "username": "Alice",
  "roomName": "Movie Night"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | String | Yes | Unique identifier for the creator |
| `username` | String | Yes | Display name in the room |
| `roomName` | String | No | Optional friendly room name |

**Response (201 Created):**

```json
{
  "roomId": "abc123",
  "hostId": "user-001",
  "roomName": "Movie Night",
  "createdAt": 1700000000000
}
```

**Errors:**

| Status | Condition |
|---|---|
| 400 | Missing required fields |

---

### GET /rooms/{id} — Get Room

Fetches room metadata and participant list.

**Response (200 OK):**

```json
{
  "roomId": "abc123",
  "hostId": "user-001",
  "roomName": "Movie Night",
  "participantCount": 3,
  "participants": [
    { "id": "user-001", "username": "Alice" },
    { "id": "user-002", "username": "Bob" },
    { "id": "user-003", "username": "Charlie" }
  ],
  "createdAt": 1700000000000
}
```

**Errors:**

| Status | Condition |
|---|---|
| 404 | Room not found |

---

### GET /health — Health Check

Simple health endpoint for monitoring and Render wake-up.

**Response (200 OK):**

```json
{
  "status": "UP",
  "timestamp": 1700000000000,
  "activeRooms": 3
}
```

---

## WebSocket Endpoint

### ws:// /ws

The WebSocket endpoint uses STOMP over SockJS.

**Connection:**

```javascript
const socket = new SockJS("https://yourapp.onrender.com/ws");
const client = Stomp.over(socket);
```

See `03_WEBSOCKET_EVENTS.md` for all events.

---

## Summary

| Method | Path | Purpose |
|---|---|---|
| POST | `/rooms` | Create a new room |
| GET | `/rooms/{id}` | Get room metadata |
| GET | `/health` | Health check |
| WebSocket | `/ws` | STOMP real-time messaging |
