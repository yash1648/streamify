# Signaling Flow

---

## Overview

Signaling is the process of establishing a WebRTC peer connection between two users. Since WebRTC cannot discover peers on its own, the Spring Boot backend acts as a signaling relay via WebSocket (STOMP).

All signaling messages follow the same routing pattern:

```
Sender → /app/signal → Backend → /user/{targetId}/queue/signal → Target
```

---

## Offer Flow

Triggered when a new user joins a room and initiates peer connections to all existing participants.

```
Joiner (User A)                    Backend                      Existing (User B)
      │                               │                              │
      │  JOIN_ROOM                     │                              │
      │──────────────────────────────►│                              │
      │                               │  USER_JOINED broadcast       │
      │                               │─────────────────────────────►│
      │                               │                              │
      │  getUserMedia()               │                              │
      │  createPeerConnection(B)      │                              │
      │  createOffer()                │                              │
      │  setLocalDescription(offer)   │                              │
      │                               │                              │
      │  OFFER (to: userB)            │                              │
      │──────────────────────────────►│                              │
      │                               │  OFFER (to: userB)           │
      │                               │─────────────────────────────►│
      │                               │                              │
      │                               │     setRemoteDescription()   │
      │                               │     createPeerConnection(A)  │
      │                               │     addTrack(localStream)    │
      │                               │     createAnswer()           │
      │                               │     setLocalDescription()    │
      │                               │                              │
```

---

## Answer Flow

```
Joiner (User A)                    Backend                      Existing (User B)
      │                               │                              │
      │                               │  ANSWER (to: userA)          │
      │                               │◄─────────────────────────────│
      │  ANSWER (to: userA)           │                              │
      │◄──────────────────────────────│                              │
      │                               │                              │
      │  setRemoteDescription(answer) │                              │
      │                               │                              │
      │  ICE Candidate exchange       │                              │
      │  (bidirectional)              │                              │
      │                               │                              │
```

---

## ICE Candidate Flow

```
Any Peer                           Backend                       Target Peer
      │                               │                              │
      │  onicecandidate fires          │                              │
      │                               │                              │
      │  ICE_CANDIDATE (to: target)    │                              │
      │──────────────────────────────►│                              │
      │                               │  ICE_CANDIDATE (to: target)  │
      │                               │─────────────────────────────►│
      │                               │                              │
      │                               │  addIceCandidate(candidate)  │
      │                               │                              │
      │  (Repeats for each candidate  │                              │
      │   until null candidate sent)  │                              │
```

---

## Complete Connection Sequence (3-user room)

```
Room: Users A (host), B, C

User C joins (latest) ── must connect to A and B

User C                    Backend                   User A          User B
  │                         │                         │              │
  │  OFFER (to: A) ───────►│── OFFER (to: A) ───────►│              │
  │  OFFER (to: B) ───────►│── OFFER (to: B) ──────────────────────►│
  │                         │                         │              │
  │                         │◄── ANSWER (from: A) ────│              │
  │◄── ANSWER (from: A) ────│                         │              │
  │                         │◄── ANSWER (from: B) ──────────────────│
  │◄── ANSWER (from: B) ────│                         │              │
  │                         │                         │              │
  │  ICE(A) ◄══════════════►│════════════════════════►│              │
  │  ICE(B) ◄══════════════►│═══════════════════════════════════════►│
  │                         │                         │              │
  │  [P2P Audio A] ◄══════════════════════════════════►              │
  │  [P2P Audio B] ◄════════════════════════════════════════════════►│
```

---

## Signaling Message Payloads

All signaling messages are sent to `/app/signal` with the following structure:

### OFFER

```json
{
  "type": "OFFER",
  "roomId": "abc123",
  "fromId": "user-001",
  "toId": "user-002",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=...\r\n..."
  }
}
```

### ANSWER

```json
{
  "type": "ANSWER",
  "roomId": "abc123",
  "fromId": "user-002",
  "toId": "user-001",
  "sdp": {
    "type": "answer",
    "sdp": "v=0\r\no=...\r\n..."
  }
}
```

### ICE_CANDIDATE

```json
{
  "type": "ICE_CANDIDATE",
  "roomId": "abc123",
  "fromId": "user-001",
  "toId": "user-002",
  "candidate": {
    "candidate": "candidate:842163049 1 udp 1677722111 192.168.1.5 54231 typ srflx",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

---

## Disconnection Signaling

When a user leaves or disconnects:

1. **Graceful leave:** `LEAVE_ROOM` → server broadcasts `USER_LEFT` → peers close peer connections
2. **Unexpected disconnect:** WebSocket disconnect event → server broadcasts `USER_LEFT` → peers close peer connections
3. **ICE failure:** Peer detects `iceconnectionstatechange === 'failed'` → local retry or removal
