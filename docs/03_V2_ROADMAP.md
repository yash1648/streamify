# V2 Roadmap

---

## Goal

Extend the MVP with enhanced host controls, screen sharing, and a more polished user experience.

---

## Features

### Screen Sharing

- Host can share their screen into the room
- Track replacement on active WebRTC connections
- Bandwidth-aware quality control
- Stop sharing restores video player view

### Host Controls

- Host can kick participants
- Host can transfer host role manually
- Host can lock the room (prevent new joins)
- Host can mute all participants

### Room Passwords

- Optional password on room creation
- Password prompt on room join
- Backend password validation

### Invite System

- Shareable invite link with optional expiry
- Room link copy button in UI
- Link-based join flow

### Latency Dashboard

- Per-user sync offset display
- Visual latency indicator
- Host can see drift per peer

### Voice Activity Detection (VAD)

- Visual speaker indicator per user
- Automatic detection of who is speaking
- No manual signaling required

### Advanced Sync Recovery

- Automatic re-sync when peer drift > threshold
- Graceful handling of buffering / stall events
- Host heartbeat with acknowledgement from peers
