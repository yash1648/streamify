# Product Requirements

---

## Functional Requirements

### Room Management

| Requirement | Description |
|---|---|
| Create Room | Any user can create a new room; becomes the host |
| Join Room | Users join via room ID or share link |
| Leave Room | User can leave at any time; host transfer triggered if host leaves |

### Chat

| Requirement | Description |
|---|---|
| Send Messages | Users can type and send text messages to the room |
| Receive Messages | All users in the room receive messages in real time |

### Synchronization

| Requirement | Description |
|---|---|
| Play | Host triggers play; all peers sync |
| Pause | Host triggers pause; all peers pause |
| Seek | Host seeks to timestamp; all peers jump to same position |
| Video URL Update | Host changes the video URL; all peers reload with new URL |

### Voice

| Requirement | Description |
|---|---|
| Join Voice | User joins the WebRTC voice channel |
| Leave Voice | User disconnects from voice without leaving room |
| Mute | User mutes their own microphone |
| Unmute | User re-enables their microphone |

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Sync Latency | < 500ms from host action to all peers |
| Max Room Size | 8 concurrent users |
| Room Stability | 99% uptime per session |
| Reconnect Handling | Automatic reconnect within 5 seconds on disconnect |
| Deployment Cost | $0/month on free tiers |
