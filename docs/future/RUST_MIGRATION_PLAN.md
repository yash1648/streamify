# Rust Migration Plan

---

## Overview

As the platform grows, certain backend services benefit from Rust's performance characteristics. This document outlines the phased migration of latency-sensitive services from Spring Boot to Rust.

**Target Framework:** Axum (primary) or Actix-web  
**Target Runtime:** Tokio async runtime

---

## Current Spring Modules

```
Spring Boot Backend
├── RoomService         (in-memory CRUD)     ← Low priority for migration
├── ChatService         (message relay)      ← Low priority
├── SyncService         (video sync engine)  ← High priority
├── SignalingService    (WebRTC signaling)   ← HIGHEST priority
└── PresenceService     (join/leave/host)    ← Medium priority
```

---

## Future Rust Modules

```
Rust Backend (axum)
├── signaling-service   (WebRTC signaling relay)
├── sync-service        (video state + heartbeat)
├── presence-service    (join/leave/host transfer)
│
├── (remaining in Spring Boot)
├── room-service        (room CRUD)
└── chat-service        (message relay)
```

---

## Migration Order

```
Phase 1: Signaling Service
         Spring Boot ──► Rust
         (WebRTC OFFER/ANSWER/ICE relay)

Phase 2: Sync Service
         Spring Boot ──► Rust
         (VideoState, heartbeat, drift broadcast)

Phase 3: Presence Service
         Spring Boot ──► Rust
         (Join/leave, host transfer)

Phase 4: (Optional) Room + Chat
         Spring Boot ──► Rust
         (Full backend in Rust)
```

---

## Phase 1 — Signaling Service

**Why first:** Signaling is the most latency-sensitive operation. Every WebRTC connection establishment requires 3+ signaling round trips. Lower latency = faster voice connection.

### Current (Spring Boot)

```java
// SignalingService.java
public void relay(String roomId, String fromId, String toId, SignalPayload payload) {
    // Serialize → lookup session → send to /user/{toId}/queue/signal
    messagingTemplate.convertAndSendToUser(toId, "/queue/signal", payload);
}
```

### Target (Rust/Axum)

```rust
// signaling_service.rs
use axum::extract::ws::{Message, WebSocket};
use tokio::sync::broadcast;

struct SignalingService {
    // Room ID → (User ID → Sender)
    connections: HashMap<String, HashMap<String, mpsc::UnboundedSender<Message>>>,
}

impl SignalingService {
    async fn relay(&mut self, room_id: &str, from_id: &str, to_id: &str, payload: SignalPayload) {
        if let Some(room) = self.connections.get(room_id) {
            if let Some(sender) = room.get(to_id) {
                let _ = sender.send(Message::Text(serde_json::to_string(&payload).into()));
            }
        }
    }
}
```

### Compatibility Strategy

- Rust service exposes HTTP + WebSocket endpoints
- Spring Boot proxies signaling events to Rust via internal HTTP call
- During Phase 1, Spring Boot remains the entry point for all WebSocket connections
- Signaling payloads are forwarded to Rust for relaying

```
Client WebSocket ──► Spring Boot ──► Rust Signaling
                          │                  │
                    (room/chat)         (WebRTC relay)
```

---

## Phase 2 — Sync Service

**Why second:** Sync engine runs a 5-second heartbeat and handles drift correction. Moving to Rust reduces jitter in heartbeat timing.

### Current (Spring Boot)

```java
// SyncService.java
@Scheduled(fixedDelay = 5000)
public void broadcastHeartbeat() {
    rooms.forEach((roomId, room) -> {
        VideoState state = room.getVideoState();
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId,
            new SyncEvent(state)
        );
    });
}
```

### Target (Rust/Axum)

```rust
// sync_service.rs
async fn heartbeat_loop(rooms: Arc<RwLock<HashMap<String, Room>>>) {
    let mut interval = tokio::time::interval(Duration::from_secs(5));
    loop {
        interval.tick().await;
        let rooms = rooms.read().await;
        for (room_id, room) in rooms.iter() {
            // Broadcast heartbeat to all room subscribers
            room.broadcast(SyncEvent::from(&room.video_state)).await;
        }
    }
}
```

---

## Phase 3 — Presence Service

**Why third:** Presence service manages join/leave/host transfer. It depends on RoomService (stays in Spring) but can communicate via shared state or internal API.

### Cross-Service Communication

During migration, Rust services communicate with Spring Boot via HTTP or a shared in-memory store (Redis if needed, or direct TCP):

```
┌──────────────────────┐     ┌──────────────────────┐
│   Spring Boot        │     │     Rust (Axum)       │
│                      │     │                       │
│  RoomService ──HTTP──┼───► │  PresenceService      │
│  ChatService         │     │  SyncService          │
│                      │     │  SignalingService     │
└──────────────────────┘     └──────────────────────┘
```

---

## Deployment Architecture (Post-Migration)

```
Vercel ──► React Frontend
               │
          WebSocket
               │
    ┌──────────┴──────────┐
    │                     │
Spring Boot           Rust (Axum)
(room, chat)          (signaling, sync, presence)
    │                     │
    └──────────┬──────────┘
               │
        In-Memory State
     (or Redis if needed)
```

---

## Migration Risks

| Risk | Mitigation |
|---|---|
| Increased complexity with hybrid backend | Keep Spring Boot endpoints as fallback |
| WebSocket connection split | Spring Boot proxies to Rust; clients see single endpoint |
| State inconsistency between services | Single ownership model: each piece of state owned by one service |
| Higher memory usage | Rust is more memory-efficient per connection |
| Team Rust expertise | Start with isolated signaling (smallest scope) |

---

## Rollback Plan

Each phase is reversible. If Rust signaling has issues, the Spring Boot signaling code is kept as a fallback:

1. Switch `@app/signal` routing back to Spring Boot handler
2. Restart Spring Boot (connections drain)
3. Rust service removed from proxy path

No data migration needed — all state is in-memory and ephemeral.
