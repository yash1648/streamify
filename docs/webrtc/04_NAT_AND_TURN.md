# NAT and TURN

---

## Overview

NAT traversal is handled by WebRTC's ICE framework. In most cases, STUN is sufficient for peer-to-peer connections. TURN is a fallback for restrictive NATs.

---

## ICE Framework

```
Peer A                     STUN/TURN Server                Peer B
  │                              │                           │
  │  STUN Request                │                           │
  │─────────────────────────────►│                           │
  │◄── STUN Response: 1.2.3.4 ──│                           │
  │                              │                           │
  │                              │    STUN Request            │
  │                              │◄──────────────────────────│
  │                              │── STUN Response: 5.6.7.8 ►│
  │                              │                           │
  │  ICE Candidate: 1.2.3.4      │      ICE Candidate: 5.6.7.8
  │  (via signaling)             │      (via signaling)      │
  │                              │                           │
  │  ──────────────────── P2P Check ────────────────────────►│
  │  ◄───────────────────────────────────────────────────────│
  │                              │                           │
  │  (If P2P fails)              │                           │
  │  TURN Allocate               │                           │
  │─────────────────────────────►│                           │
  │◄── TURN Relay: x.x.x.x:3478─│                           │
  │                              │                           │
  │  ──────── Relay via TURN ────│──────────────────────────►│
```

---

## STUN (Session Traversal Utilities for NAT)

STUN allows a peer to discover its public IP address and port.

**Configuration (V1):**

```javascript
const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};
```

**How it works:**
1. Peer sends STUN request to public STUN server
2. STUN server responds with the peer's public IP:port
3. This becomes an ICE candidate shared via signaling
4. The other peer tries to connect to that public address

**Limitation:** STUN fails on symmetric NATs and some corporate firewalls.

---

## TURN (Traversal Using Relays around NAT)

TURN relays media through a server when P2P fails. It is a last resort because of bandwidth/cost.

**Configuration (V2, optional):**

```javascript
const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:turn.example.com:3478",
      username: "your-username",
      credential: "your-credential"
    }
  ]
};
```

**Cost Consideration:**
- TURN relays all media through the server
- For 8 users in a mesh, relay bandwidth = sum of all streams
- Free TURN: limited (e.g., Metered.ca free tier: 500MB/month)
- Recommended: use only as fallback with ICE candidate priority

---

## ICE Candidate Types

| Type | Priority | Description |
|---|---|---|
| `host` | Highest | Local IP address (same network) |
| `srflx` | Medium | Public IP discovered via STUN |
| `relay` | Lowest | TURN relay address |

**WebRTC ICE candidate gathering order:**

```
host candidates (local IPs)
    │
    ▼
srflx candidates (STUN)
    │
    ▼
relay candidates (TURN) — only if configured
```

---

## NAT Scenarios

| Scenario | Connection Type | V1 Support |
|---|---|---|
| Both peers on same network | host (direct) | ✅ Always works |
| Public IP / no NAT | host + srflx | ✅ Always works |
| Peer behind cone NAT | srflx (STUN) | ✅ Works |
| Peer behind symmetric NAT | relay (TURN) | ❌ V1: may fail; V2: TURN fallback |
| Corporate firewall | relay (TURN) | ❌ V1: likely blocked; V2: TURN fallback |

---

## ICE Restart

When a connection fails due to NAT changes (e.g., network switch):

```javascript
async function iceRestart(pc) {
  pc.restartIce();
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);
  websocketService.publish("/app/signal", {
    type: "OFFER",
    roomId,
    fromId: userId,
    toId: peerId,
    sdp: offer
  });
}
```

ICE restart generates new candidates without recreating the peer connection.

---

## Fallback Flow

```
ICE negotiation starts
        │
        ▼
Try host candidates ──── SUCCESS? ──► P2P (same network)
        │
        NO
        ▼
Try srflx candidates ─── SUCCESS? ──► P2P (STUN)
        │
        NO
        ▼
Try relay candidates ─── SUCCESS? ──► TURN relay
(V2 only)                   │
                            NO
                            ▼
                      Voice unavailable
                      (Show "Voice blocked" indicator)
```

---

## Summary

| Component | V1 | V2 |
|---|---|---|
| STUN (Google Public) | ✅ Included | ✅ Included |
| TURN | ❌ Not configured | ✅ Optional fallback |
| ICE restart | ❌ Not implemented | ✅ Implemented |
| NAT detection | ❌ Not implemented | ✅ Latency dashboard |
| Connection stats | ❌ Not implemented | ✅ Latency dashboard |
