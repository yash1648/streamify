# UI Flow

---

## Overview

This document describes the key user journeys through the application.

---

## Create Room Flow

```
User opens app at "/"
        │
        ▼
┌─────────────────────────┐
│      HomePage           │
│                         │
│  [Room Name (optional)] │
│  [   Create Room    ]   │
└─────────────────────────┘
        │
        ▼
POST /rooms  { userId, username, roomName? }
        │
        ▼
Server returns { roomId, hostId }
        │
        ▼
Redirect to /room/{roomId}
        │
        ▼
┌──────────────────────────────┐
│         RoomPage             │
│                              │
│  VideoPlayer (idle, no URL)  │
│  ChatPanel (empty)           │
│  VoiceControls               │
│  UserList (just you)         │
│                              │
│  "Waiting for others..."     │
└──────────────────────────────┘
        │
        ▼
WebSocket connects → subscribes to /topic/room/{id}
        │
        ▼
JOIN_ROOM sent → USER_JOINED broadcast
```

---

## Join Room Flow

```
User has room ID
        │
        ▼
┌─────────────────────────┐
│      HomePage           │
│                         │
│  [Room ID: abc123    ]  │
│  [   Join Room      ]   │
└─────────────────────────┘
        │
        ▼
GET /rooms/{id}  → validate room exists
        │
        ▼
Redirect to /room/{id}
        │
        ▼
┌───────────────────────────────────┐
│          RoomPage                 │
│                                   │
│  VideoPlayer (syncs to host)      │
│  ChatPanel (previous messages)    │
│  VoiceControls (join voice)       │
│  UserList (participants + you)    │
└───────────────────────────────────┘
        │
        ▼
WebSocket connects
        │
        ▼
JOIN_ROOM sent → USER_JOINED broadcast
        │
        ▼
Server sends initial SYNC_STATE via /user/{id}/queue/sync
        │
        ▼
VideoPlayer seeks to current playback position
```

---

## Voice Join Flow

```
User is inside RoomPage
        │
        ▼
"Join Voice" button clicked
        │
        ▼
getUserMedia({ audio: true })
        │
        ▼
Local audio stream acquired
        │
        ▼
For each existing participant:
        │
        ├── createPeerConnection(participantId)
        ├── addTrack(localStream)
        ├── createOffer()
        ├── setLocalDescription(offer)
        └── send OFFER via WebSocket
        │
        ▼
Remote peers create ANSWER + exchange ICE
        │
        ▼
All peer connections established
        │
        ▼
UI shows "Connected" + VoiceControls active
        │
        ▼
Remote audio streams attached to <audio> elements
```

---

## Sync Flow

```
Host presses Play
        │
        ▼
Host UI: Play button enabled (non-host sees disabled)
        │
        ▼
useSync hook → publish PLAY to /app/sync.play
        │
        ▼
Backend SyncService:
  - Updates VideoState
  - Broadcasts SYNC_STATE to /topic/room/{id}
        │
        ▼
All peers receive SYNC_STATE
        │
        ▼
useSync hook → updates syncStore
        │
        ▼
VideoPlayer component re-renders:
  - player.seekTo(currentTime)
  - player.play()
        │
        ▼
Every 5s: heartbeat SYNC_STATE
        │
        ▼
Drift detection runs on each heartbeat
  - drift > 2s → auto seek correction
```

---

## Leave Room Flow

```
User clicks "Leave Room" button
        │
        ▼
LEAVE_ROOM sent via WebSocket
        │
        ▼
All stores reset (room, chat, voice, sync)
        │
        ▼
WebSocket disconnected
        │
        ▼
WebRTC peer connections closed
        │
        ▼
Redirect to "/"
        │
        ▼
If user was host:
  → Host transfer triggered
  → HOST_TRANSFERRED broadcast
  → Earliest joiner becomes new host

If user was last participant:
  → Room destroyed on server
```

---

## Reconnect Flow (V1 Sprint 5)

```
WebSocket disconnects unexpectedly
        │
        ▼
5-second reconnect timer starts
        │
        ▼
On reconnect:
  ├── Re-subscribe to /topic/room/{id}
  ├── Re-join room JOIN_ROOM
  └── Receive latest SYNC_STATE
        │
        ▼
If host disconnected > 10s:
  → Host transfer already occurred
  → Peer sees new hostId in roomStore
```
