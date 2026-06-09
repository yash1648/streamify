# Sync Engine

---

## Overview

The sync engine ensures all participants watch the same video at the same time. It follows a **host authority model**: only the host can trigger play, pause, seek, or URL changes. All peers receive and apply those events.

---

## Host Authority Model

```
Host clicks Play
      |
      v
Frontend sends PLAY event via WebSocket
      |
      v
Spring Boot SyncService receives PLAY
      |
      v
Updates VideoState { playing: true, currentTime: X }
      |
      v
Broadcasts SYNC_STATE to /topic/room/{id}
      |
      v
All peers receive SYNC_STATE
      |
      v
React Player.seekTo(currentTime) + .play()
```

Non-host users have video controls disabled in the UI.

---

## VideoState Model

The server holds one `VideoState` object per room:

```json
{
  "playing": true,
  "currentTime": 55.5,
  "videoUrl": "https://www.youtube.com/watch?v=example",
  "lastUpdatedAt": 1700000000000,
  "hostId": "user-abc"
}
```

---

## Heartbeat System

The server sends a heartbeat every **5 seconds** to every room:

```json
{
  "type": "SYNC_STATE",
  "playing": true,
  "currentTime": 72.3,
  "videoUrl": "https://..."
}
```

This allows:
- Late joiners to immediately catch up
- Drift to be detected and corrected
- Recovery after brief disconnects

---

## Drift Detection

Each client calculates its local drift on every heartbeat:

```javascript
const drift = Math.abs(player.getCurrentTime() - syncState.currentTime);

if (drift > DRIFT_THRESHOLD_SECONDS) {
  player.seekTo(syncState.currentTime);
}
```

| Constant | Value |
|---|---|
| `DRIFT_THRESHOLD_SECONDS` | `2.0` |

---

## Auto Correction

If drift exceeds the threshold, the player silently seeks to the correct time. The user does not need to take any action.

```javascript
function applySync(syncState) {
  const drift = Math.abs(player.getCurrentTime() - syncState.currentTime);

  if (drift > DRIFT_THRESHOLD_SECONDS) {
    player.seekTo(syncState.currentTime, "seconds");
  }

  if (syncState.playing !== player.isPlaying()) {
    syncState.playing ? player.play() : player.pause();
  }
}
```

---

## Resynchronization on Room Join

When a user joins a room, the server immediately sends the current `VideoState` as a one-time `SYNC_STATE` event to that user's private channel. This ensures the new user starts at the correct position.

```
User joins room
      |
      v
Server sends current VideoState to /user/{id}/queue/sync
      |
      v
Client applies initial sync state
```

---

## Sync Event Flow Summary

| Host Action | Event Sent | Server Response | Peer Effect |
|---|---|---|---|
| Play | PLAY | Update + broadcast | Player plays |
| Pause | PAUSE | Update + broadcast | Player pauses |
| Seek | SEEK + time | Update + broadcast | Player seeks |
| URL Change | VIDEO_URL_UPDATE | Update + broadcast | Player reloads |
| (periodic) | — | SYNC_STATE heartbeat | Drift correction |
