# V2 Features — Detailed Specification

---

## Screen Sharing

### Overview

The host can share their screen with all room participants. Screen share uses WebRTC track replacement — the host's video track is replaced with a display-capture track on all existing peer connections.

### Architecture

```
Host clicks "Share Screen"
        │
        ▼
getDisplayMedia({ video: true })  ← browser prompt
        │
        ▼
Display stream acquired
        │
        ▼
For each peer connection:
  │
  ├── Find video sender
  ├── sender.replaceTrack(displayTrack)
  └── Notify room via WebSocket
        │
        ▼
Peers switch from VideoPlayer to remote <video> element
```

### Key Considerations

- No new peer connections needed (track replacement)
- Screen share stops when user clicks "Stop Sharing" or browser toolbar "Stop"
- When stopped, the video player view is restored for all peers
- Late joiners during screen share auto-receive the display track

### Bandwidth Management

See `webrtc/03_SCREEN_SHARE_V2.md` for bandwidth requirements and adaptive quality.

---

## Host Controls

### Kick Participant

Host can remove a participant from the room:

```json
// Client → Server
{
  "type": "KICK_PARTICIPANT",
  "roomId": "abc123",
  "hostId": "user-001",
  "targetId": "user-003"
}

// Server → Target (private)
{
  "type": "YOU_WERE_KICKED",
  "roomId": "abc123"
}

// Server → Room (broadcast)
{
  "type": "USER_LEFT",
  "userId": "user-003",
  "reason": "kicked"
}
```

### Manual Host Transfer

Host can transfer the host role to another participant:

```json
// Client → Server
{
  "type": "TRANSFER_HOST",
  "roomId": "abc123",
  "hostId": "user-001",
  "newHostId": "user-002"
}

// Server → Room (broadcast)
{
  "type": "HOST_TRANSFERRED",
  "newHostId": "user-002",
  "previousHostId": "user-001"
}
```

### Lock Room

Host can lock the room to prevent new joins:

```json
// Client → Server
{
  "type": "LOCK_ROOM",
  "roomId": "abc123",
  "hostId": "user-001"
}

// Server → Room (broadcast)
{
  "type": "ROOM_LOCKED"
}

// When locked, JOIN_ROOM from new users is rejected
{
  "type": "JOIN_REJECTED",
  "reason": "room_locked"
}
```

### Mute All

Host can mute all participants (local mute, not enforced):

```json
// Client → Server
{
  "type": "MUTE_ALL",
  "roomId": "abc123",
  "hostId": "user-001"
}

// Server → Room (broadcast)
{
  "type": "FORCE_MUTE"
}
```

Peers receive `FORCE_MUTE` and locally mute their audio tracks. Users can unmute themselves afterwards.

---

## Room Passwords

### Flow

1. Host sets optional password on `POST /rooms`
2. Joining user must provide password
3. Backend validates password before accepting `JOIN_ROOM`
4. Wrong password → `JOIN_REJECTED { reason: "invalid_password" }`

### Payload

```json
// Create room with password
POST /rooms
{
  "userId": "user-001",
  "username": "Alice",
  "roomPassword": "secret123"
}

// Join room with password
JOIN_ROOM
{
  "roomId": "abc123",
  "userId": "user-002",
  "username": "Bob",
  "roomPassword": "secret123"
}
```

### Storage

Password is stored in memory alongside room data:

```java
public class Room {
    // ... existing fields
    String roomPassword;    // null if no password
    boolean locked;         // V2: lock room
}
```

---

## Invite System

### Features

- Shareable room link: `https://yourapp.vercel.app/room/{roomId}`
- Copy link button in RoomPage UI
- Optional invite link expiry (time-based)
- Room ID displayed prominently for manual sharing

### Invite Link Format

```
https://yourapp.vercel.app/room/abc123
```

Room ID is the only identifier needed. No auth required.

---

## Latency Dashboard

### Metrics

- Per-user sync offset (ms)
- Round-trip time to server (ms)
- WebSocket connection health
- ICE connection state (WebRTC)

### Display

Host sees a dashboard panel showing:

```
 Latency Dashboard
 ┌─────────────────────────┐
 │ Alice   ◉ connected     │
 │         sync offset: 120ms │
 │         RTT: 45ms       │
 ├─────────────────────────┤
 │ Bob     ◉ connected     │
 │         sync offset: 300ms │
 │         RTT: 89ms       │
 ├─────────────────────────┤
 │ Charlie ◉ disconnected  │
 │         last seen: 5s ago │
 └─────────────────────────┘
```

---

## Voice Activity Detection (VAD)

### Implementation

Using Web Audio API analyser node to detect speaking:

```javascript
function createVAD(audioStream, onSpeaking, onSilence) {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(audioStream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const buffer = new Uint8Array(analyser.frequencyBinCount);

  function check() {
    analyser.getByteTimeDomainData(buffer);
    const max = Math.max(...buffer);
    const isSpeaking = (max - 128) > SPEAKING_THRESHOLD;

    if (isSpeaking) onSpeaking();
    else onSilence();

    requestAnimationFrame(check);
  }

  check();
}
```

### UI

- Active speakers get a green indicator border in UserList
- Multiple speakers can be detected simultaneously
- VAD is local-only in V2 (no broadcasting of speaking state)

---

## Advanced Sync Recovery

### Heartbeat Acknowledgement

In V2, peers acknowledge heartbeat receipt:

```
Server sends SYNC_STATE ──► Client
Client responds ──► ACK { drift: 0.3 }
Server tracks drift per peer
If drift > threshold: server sends corrective SYNC_STATE
```

### Buffering / Stall Handling

When a peer experiences buffering:

1. Peer detects `onBuffer` or `onStall` from React Player
2. Peer temporarily pauses local playback
3. On `onBufferEnd` or `canplay`, peer seeks to latest SYNC_STATE
4. Player resumes at correct position

### Drift Threshold

| Constant | V1 | V2 |
|---|---|---|
| `DRIFT_THRESHOLD_SECONDS` | 2.0s | 1.0s |
| Correction interval | On heartbeat | Continuous monitoring |
