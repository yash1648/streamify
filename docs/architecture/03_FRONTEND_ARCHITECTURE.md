# Frontend Architecture

---

## Overview

The frontend is a React SPA (Single Page Application) built with Vite. It communicates with the backend via WebSocket (STOMP) for real-time events and via REST for room creation and initial data fetching. WebRTC peer connections are managed directly in the browser.

---

## Pages

| Page | Route | Description |
|---|---|---|
| `HomePage` | `/` | Create or join a room |
| `RoomPage` | `/room/:id` | The main watch-party room |

---

## Component Tree

```
App
├── HomePage
│   ├── CreateRoomForm
│   └── JoinRoomForm
│
└── RoomPage
    ├── VideoPlayer          (React Player wrapper)
    ├── ChatPanel
    │   ├── MessageList
    │   └── MessageInput
    ├── VoiceControls
    │   ├── MuteButton
    │   └── VoiceStatusIndicator
    └── UserList
        └── UserCard (per participant)
```

---

## Hooks

| Hook | Purpose |
|---|---|
| `useRoom` | Manages room join/leave lifecycle |
| `useChat` | Subscribes to chat events, sends messages |
| `useSync` | Subscribes to video sync events, controls React Player |
| `useVoice` | Manages WebRTC peer connections and audio tracks |
| `useWebSocket` | Core STOMP connection and subscription management |
| `usePresence` | Tracks participant list changes |

---

## Services

| Service | Purpose |
|---|---|
| `roomService.js` | REST calls: create room, get room |
| `websocketService.js` | STOMP client setup, connect/disconnect |
| `webrtcService.js` | PeerConnection factory, offer/answer/ICE |

---

## Stores (Zustand)

| Store | State Held |
|---|---|
| `roomStore` | `roomId`, `hostId`, `participants` |
| `chatStore` | `messages[]` |
| `voiceStore` | `muted`, `peers`, `localStream` |
| `syncStore` | `playing`, `currentTime`, `videoUrl` |

---

## Component Relationships

```
RoomPage
    |
    ├── reads:  roomStore (roomId, hostId)
    ├── reads:  syncStore (playing, currentTime)
    |
    ├── VideoPlayer
    │       reads: syncStore
    │       calls: SyncService via useSync hook
    |
    ├── ChatPanel
    │       reads: chatStore.messages
    │       calls: websocketService.sendMessage
    |
    ├── VoiceControls
    │       reads: voiceStore.muted
    │       calls: webrtcService (mute/unmute)
    |
    └── UserList
            reads: roomStore.participants
            reads: voiceStore.peers (to show speaking indicator)
```

---

## Routing

```javascript
// App.jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/room/:id" element={<RoomPage />} />
</Routes>
```

---

## Environment Variables

```env
VITE_BACKEND_URL=https://yourapp.onrender.com
VITE_WS_URL=wss://yourapp.onrender.com/ws
```
