# WebSocket Events

---

## Overview

All real-time communication uses STOMP over WebSocket. Events are grouped by domain.

- **Client → Server:** sent to `/app/...`
- **Server → All in room:** broadcast to `/topic/room/{roomId}`
- **Server → One user:** sent to `/user/{userId}/queue/...`

---

## Presence Events

### JOIN_ROOM

**Direction:** Client → Server

**Destination:** `/app/room.join`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "username": "Alice"
}
```

**Server response — broadcast to room:**

```json
{
  "type": "USER_JOINED",
  "userId": "user-001",
  "username": "Alice",
  "participants": ["user-001", "user-002"]
}
```

---

### LEAVE_ROOM

**Direction:** Client → Server

**Destination:** `/app/room.leave`

```json
{
  "roomId": "abc123",
  "userId": "user-001"
}
```

**Server response — broadcast to room:**

```json
{
  "type": "USER_LEFT",
  "userId": "user-001",
  "participants": ["user-002"]
}
```

---

### HOST_TRANSFERRED

**Direction:** Server → All in room (broadcast)

```json
{
  "type": "HOST_TRANSFERRED",
  "newHostId": "user-002"
}
```

---

## Chat Events

### SEND_MESSAGE

**Direction:** Client → Server

**Destination:** `/app/room.chat.send`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "username": "Alice",
  "content": "Hello everyone!"
}
```

---

### CHAT_MESSAGE

**Direction:** Server → All in room (broadcast)

**Channel:** `/topic/room/{roomId}`

```json
{
  "type": "CHAT_MESSAGE",
  "message": {
    "roomId": "abc123",
    "userId": "user-001",
    "username": "Alice",
    "content": "Hello everyone!",
    "timestamp": 1700000000000
  }
}
```

---

## Sync Events

### PLAY

**Direction:** Client (host only) → Server

**Destination:** `/app/room.sync.play`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "currentTime": 55.5
}
```

**Server broadcasts `SYNC_STATE`:**

```json
{
  "type": "SYNC_STATE",
  "action": "PLAY",
  "playing": true,
  "currentTime": 55.5,
  "videoUrl": "https://...",
  "timestamp": 1700000000000
}
```

Action values: `URL_CHANGED`, `PLAY`, `PAUSE`, `SEEK`, `HEARTBEAT`

---

### PAUSE

**Direction:** Client (host only) → Server

**Destination:** `/app/room.sync.pause`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "currentTime": 55.5
}
```

---

### SEEK

**Direction:** Client (host only) → Server

**Destination:** `/app/room.sync.seek`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "currentTime": 120.0
}
```

---

### VIDEO_URL_UPDATE

**Direction:** Client (host only) → Server

**Destination:** `/app/room.sync.url`

```json
{
  "roomId": "abc123",
  "userId": "user-001",
  "videoUrl": "https://www.youtube.com/watch?v=newvideo"
}
```

---

### SYNC_STATE (heartbeat)

**Direction:** Server → All in room (broadcast, every 5 seconds)

```json
{
  "type": "SYNC_STATE",
  "action": "HEARTBEAT",
  "playing": true,
  "currentTime": 72.3,
  "videoUrl": "https://...",
  "timestamp": 1700000000000
}
```

---

## WebRTC Signaling Events

### OFFER

**Direction:** Client → Server → Target peer

**Destination:** `/app/signal`

```json
{
  "type": "OFFER",
  "roomId": "abc123",
  "fromId": "user-001",
  "toId": "user-002",
  "sdp": { "type": "offer", "sdp": "v=0\r\n..." }
}
```

---

### ANSWER

**Direction:** Client → Server → Target peer

**Destination:** `/app/signal`

```json
{
  "type": "ANSWER",
  "roomId": "abc123",
  "fromId": "user-002",
  "toId": "user-001",
  "sdp": { "type": "answer", "sdp": "v=0\r\n..." }
}
```

---

### ICE_CANDIDATE

**Direction:** Client → Server → Target peer

**Destination:** `/app/signal`

```json
{
  "type": "ICE_CANDIDATE",
  "roomId": "abc123",
  "fromId": "user-001",
  "toId": "user-002",
  "candidate": {
    "candidate": "candidate:...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

---

## Event Reference Table

| Event | Direction | Channel |
|---|---|---|
| `JOIN_ROOM` | Client → Server | `/app/room.join` |
| `LEAVE_ROOM` | Client → Server | `/app/room.leave` |
| `USER_JOINED` | Server → Room | `/topic/room/{id}` |
| `USER_LEFT` | Server → Room | `/topic/room/{id}` |
| `HOST_TRANSFERRED` | Server → Room | `/topic/room/{id}` |
| `SEND_MESSAGE` | Client → Server | `/app/room.chat.send` |
| `CHAT_MESSAGE` | Server → Room | `/topic/room/{id}` |
| `PLAY` | Client → Server | `/app/room.sync.play` |
| `PAUSE` | Client → Server | `/app/room.sync.pause` |
| `SEEK` | Client → Server | `/app/room.sync.seek` |
| `VIDEO_URL_UPDATE` | Client → Server | `/app/room.sync.url` |
| `SYNC_STATE` | Server → Room | `/topic/room/{id}` |
| `SYNC_STATE` (initial) | Server → User | `/user/{id}/queue/sync` |
| `OFFER` | Client → Server → Peer | `/app/signal` → `/user/{id}/queue/signal` |
| `ANSWER` | Client → Server → Peer | `/app/signal` → `/user/{id}/queue/signal` |
| `ICE_CANDIDATE` | Client → Server → Peer | `/app/signal` → `/user/{id}/queue/signal` |
