# System Architecture

---

## Stack Overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React | Vite, Zustand, React Player |
| Backend | Spring Boot | Java 21, STOMP over WebSocket |
| Realtime | WebSocket | STOMP protocol, per-room topics |
| Voice | WebRTC | Full mesh, no SFU |
| Media Player | React Player | Supports YouTube, direct URLs |
| Storage | In-Memory | ConcurrentHashMap — no database |
| Frontend Deploy | Vercel | Free tier, CI/CD from GitHub |
| Backend Deploy | Render | Free tier, auto-sleep on idle |

---

## High-Level Topology

```
Browser (User A)                Browser (User B)
      |                                |
      |------- WebSocket (STOMP) ------>|
      |              |                  |
      |        Spring Boot              |
      |        (Render.com)             |
      |              |                  |
      |       Signaling Events          |
      |              |                  |
      |<------ WebRTC Offer/Answer ---->|
      |                                 |
      |<====== WebRTC Audio Stream ====>|
             (Direct P2P — no relay)
```

---

## Component Interaction Flow

```
User Action (Play / Pause / Seek)
        |
        v
React Frontend
        |
        v
WebSocket (STOMP) ──► Spring Boot
                            |
                    Room / Sync Service
                            |
                    Broadcast to /topic/room/{id}
                            |
                    All connected clients receive event
                            |
                    React Player updates in sync
```

---

## WebRTC Mesh Topology

For a room with N users, each user maintains N-1 peer connections.

```
User A ─────── User B
   \               /
    └──── User C ──┘
```

- Maximum peers: 7 (for 8-user room)
- Signaling relayed through Spring Boot
- Media flows directly peer-to-peer (STUN/TURN assisted)

---

## Backend Module Overview

```
Spring Boot Application
├── RoomController          (REST: create/get room)
├── RoomService             (room lifecycle)
├── ChatService             (message broadcast)
├── SyncService             (play/pause/seek state)
├── SignalingService        (WebRTC offer/answer/ICE)
└── PresenceService         (join/leave/host transfer)
```

---

## Deployment Topology (Production)

```
GitHub
  |
  ├── Vercel (Frontend)
  │     └── React Build ──► https://yourapp.vercel.app
  │
  └── Render (Backend)
        └── Spring Boot ──► https://yourapp.onrender.com
                                  |
                            WebSocket /ws
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| No database | In-memory only | Zero cost, rooms are ephemeral |
| No SFU | WebRTC full mesh | Simpler for ≤8 users, zero infra cost |
| STOMP over WebSocket | Spring integration | Clean pub/sub with topic routing |
| Host authority | Single host controls video | Prevents sync conflicts |
