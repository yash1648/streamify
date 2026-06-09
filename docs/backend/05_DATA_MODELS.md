# Data Models

---

## Overview

All data models are plain Java objects held in-memory. No database is used. Models are thread-safe via `ConcurrentHashMap` and immutable where possible.

---

## Room

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique room identifier (UUID) |
| `hostId` | String | Participant ID of the current host |
| `participants` | Map<String, Participant> | Active participants keyed by ID |
| `videoState` | VideoState | Current video playback state |
| `createdAt` | Instant | Timestamp of room creation |

```java
public class Room {
    private String id;
    private String hostId;
    private Map<String, Participant> participants;
    private VideoState videoState;
    private Instant createdAt;
}
```

---

## Participant

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique participant identifier |
| `username` | String | Display name shown in room |
| `joinedAt` | Instant | When the participant joined |
| `muted` | boolean | Whether microphone is muted |

```java
public class Participant {
    private String id;
    private String username;
    private Instant joinedAt;
    private boolean muted;
}
```

---

## ChatMessage

| Field | Type | Description |
|---|---|---|
| `roomId` | String | Room the message belongs to |
| `senderId` | String | Participant who sent the message |
| `senderName` | String | Display name of sender |
| `content` | String | Message text |
| `timestamp` | Instant | When the message was sent |

```java
public class ChatMessage {
    private String roomId;
    private String senderId;
    private String senderName;
    private String content;
    private Instant timestamp;
}
```

---

## VideoState

| Field | Type | Description |
|---|---|---|
| `playing` | boolean | Whether video is currently playing |
| `currentTime` | double | Current playback position in seconds |
| `videoUrl` | String | URL of the video being watched |
| `lastUpdatedAt` | Instant | When state was last modified |

```java
public class VideoState {
    private boolean playing;
    private double currentTime;
    private String videoUrl;
    private Instant lastUpdatedAt;
}
```

---

## VoiceState

| Field | Type | Description |
|---|---|---|
| `participantId` | String | Participant this state belongs to |
| `muted` | boolean | Whether participant's audio is muted |

```java
public class VoiceState {
    private String participantId;
    private boolean muted;
}
```

---

## JSON Serialization Examples

### Room (API response)

```json
{
  "roomId": "abc123",
  "hostId": "user-001",
  "participantCount": 2,
  "participants": [
    { "id": "user-001", "username": "Alice" },
    { "id": "user-002", "username": "Bob" }
  ],
  "createdAt": 1700000000000
}
```

### VideoState (WebSocket broadcast)

```json
{
  "playing": true,
  "currentTime": 55.5,
  "videoUrl": "https://www.youtube.com/watch?v=example",
  "lastUpdatedAt": 1700000000000
}
```

### ChatMessage (WebSocket broadcast)

```json
{
  "senderId": "user-001",
  "senderName": "Alice",
  "content": "Hello everyone!",
  "timestamp": 1700000000000
}
```
