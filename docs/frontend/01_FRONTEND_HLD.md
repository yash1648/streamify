# Frontend High-Level Design

---

## Overview

The frontend is a single-page React application built with Vite. It uses Zustand for state management, React Player for video playback, and STOMP over WebSocket for real-time communication. WebRTC is handled directly via the browser API for voice.

---

## Page Architecture

```
SPA (Single Page Application)
    │
    ├── HomePage ("/")
    │       ├── CreateRoomForm
    │       └── JoinRoomForm
    │
    └── RoomPage ("/room/:id")
            ├── VideoPlayer
            ├── ChatPanel
            ├── VoiceControls
            └── UserList
```

---

## Routing

Two routes total, managed by React Router:

| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` | Room creation and join forms |
| `/room/:id` | `RoomPage` | Active watch-party room |

Navigation flow:
```
/
  │
  ├── Create Room → POST /rooms → redirect → /room/:id
  │
  └── Enter Room ID → GET /rooms/{id} → redirect → /room/:id
```

---

## Hooks

Custom hooks encapsulate all business logic and WebSocket interaction:

| Hook | Responsibility |
|---|---|
| `useWebSocket` | Core STOMP connection lifecycle (connect, disconnect, subscribe) |
| `useRoom` | Room join/leave lifecycle, room store updates |
| `useChat` | Chat subscription, message sending, chat store updates |
| `useSync` | Sync state subscription, React Player control, drift detection |
| `useVoice` | getUserMedia, peer connections, offer/answer/ICE, mute/unmute |
| `usePresence` | Participant join/leave events, host transfer detection |

---

## Services

Services provide stateless utility functions for external communication:

| Service | Purpose |
|---|---|
| `roomService.js` | REST API calls (`POST /rooms`, `GET /rooms/{id}`) |
| `websocketService.js` | STOMP client singleton, connect/disconnect/subscribe/publish |
| `webrtcService.js` | RTCPeerConnection factory, offer/answer/ICE helpers |

---

## Stores

Zustand stores hold all client-side state:

| Store | State | Updated By |
|---|---|---|
| `roomStore` | `roomId`, `hostId`, `participants` | `useRoom`, `usePresence` |
| `chatStore` | `messages[]` | `useChat` |
| `voiceStore` | `muted`, `peers`, `localStream` | `useVoice` |
| `syncStore` | `playing`, `currentTime`, `videoUrl` | `useSync` |

---

## Data Flow

```
User Action
    │
    ▼
Custom Hook
    │
    ├──► REST Service (room creation)
    └──► WebSocket Service (real-time events)
              │
              ▼
         Backend
              │
              ▼
    WebSocket Broadcast
              │
              ▼
    Custom Hook (subscription)
              │
              ▼
        Zustand Store
              │
              ▼
        React Component (re-render)
```

---

## Environment Variables

```env
VITE_BACKEND_URL=https://yourapp.onrender.com
VITE_WS_URL=wss://yourapp.onrender.com/ws
```
