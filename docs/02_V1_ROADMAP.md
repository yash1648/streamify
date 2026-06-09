# V1 Roadmap — MVP

---

## Goal

Ship a fully working watch-party room where friends can watch synchronized video together with voice and chat.

---

## Sprints

### Sprint 1 — Room Creation

- Room creation API (`POST /rooms`)
- Room join by ID
- Room state management (in-memory)
- Host assignment
- Basic WebSocket connection per room

**Deliverable:** Users can create and join rooms

---

### Sprint 2 — Chat

- WebSocket event: `SEND_MESSAGE`
- WebSocket event: `MESSAGE_RECEIVED`
- Chat UI component
- Message history (session-scoped)

**Deliverable:** Users can chat inside a room

---

### Sprint 3 — Video Sync

- WebSocket events: `PLAY`, `PAUSE`, `SEEK`, `VIDEO_URL_UPDATE`
- Host authority model
- Sync engine with drift detection
- React Player integration

**Deliverable:** Host controls play/pause/seek and all peers stay in sync

---

### Sprint 4 — Voice Chat

- WebRTC signaling: `OFFER`, `ANSWER`, `ICE_CANDIDATE`
- Peer connection lifecycle management
- Audio track handling
- Mute / unmute controls

**Deliverable:** Users can speak to each other in-room over WebRTC

---

### Sprint 5 — Reconnect Handling

- WebSocket reconnect on disconnect
- Room state re-sync on rejoin
- Host transfer on host disconnect
- Peer connection recovery

**Deliverable:** Disconnected users rejoin cleanly without breaking the room

---

## V1 Deliverables Summary

| Feature | Status |
|---|---|
| Room Creation & Join | Sprint 1 |
| Real-time Chat | Sprint 2 |
| Video Synchronization | Sprint 3 |
| Voice Chat | Sprint 4 |
| Reconnect Handling | Sprint 5 |
