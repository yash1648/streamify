# Room Management

---

## Overview

Rooms are the core unit of the platform. Each room is an isolated, ephemeral session. Rooms exist only in server memory and are destroyed when empty.

---

## Room Lifecycle

```
[CREATE]
    |
    v
[WAITING] ── users join ──► [ACTIVE]
                                  |
                         users leave / host changes
                                  |
                           last user leaves
                                  |
                                  v
                             [DESTROYED]
```

---

## Room State Machine

| State | Description |
|---|---|
| `WAITING` | Room created, host is alone or no one has joined yet |
| `ACTIVE` | At least one participant in the room |
| `DESTROYED` | All participants left; room removed from memory |

---

## Room Creation

1. User sends `POST /rooms` with optional room name
2. Server generates a unique room ID (UUID or short code)
3. Server creates `Room` object with creator as host
4. Server returns `{ roomId, hostId }`
5. Creator is redirected to `/room/:id`

```java
Room room = Room.builder()
    .id(UUID.randomUUID().toString())
    .hostId(creatorId)
    .participants(new ConcurrentHashMap<>())
    .videoState(VideoState.empty())
    .createdAt(Instant.now())
    .build();
```

---

## User Join

1. User navigates to `/room/:id`
2. Frontend fetches room metadata via `GET /rooms/{id}`
3. Frontend connects to WebSocket and subscribes to `/topic/room/{id}`
4. Frontend sends `JOIN_ROOM` event
5. Server adds participant to room
6. Server broadcasts `USER_JOINED` to all existing participants
7. Server sends current `VideoState` to the new user

---

## User Leave

1. User clicks Leave, or closes the tab, or disconnects
2. Frontend sends `LEAVE_ROOM` (if graceful)
3. Server removes participant from room
4. Server broadcasts `USER_LEFT` to remaining participants
5. If the leaving user was the host → **host transfer**
6. If the room is now empty → **room destruction**

---

## Host Transfer

Host transfer occurs when:
- Host explicitly transfers host role (V2 feature)
- Host disconnects (automatic)

**Automatic transfer logic:**
- Select the participant who joined earliest (by `joinedAt` timestamp)
- Assign that participant as the new host
- Broadcast `HOST_TRANSFERRED` event with new host ID

```java
Participant newHost = participants.values().stream()
    .filter(p -> !p.getId().equals(oldHostId))
    .min(Comparator.comparing(Participant::getJoinedAt))
    .orElse(null);
```

---

## Room Destruction

A room is destroyed when the last participant leaves:

```java
if (room.getParticipants().isEmpty()) {
    rooms.remove(room.getId());
    // No broadcast needed — no one to receive it
}
```

---

## Room Data Model

```java
public class Room {
    String id;
    String hostId;
    Map<String, Participant> participants;
    VideoState videoState;
    Instant createdAt;
}
```

---

## Participant Data Model

```java
public class Participant {
    String id;
    String username;
    Instant joinedAt;
    boolean muted;
}
```
