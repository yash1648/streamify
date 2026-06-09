# Backend Low-Level Design

---

## Class Diagram

```
Room
├── id: String
├── hostId: String
├── participants: Map<String, Participant>
├── videoState: VideoState
└── createdAt: Instant

Participant
├── id: String
├── username: String
├── joinedAt: Instant
└── muted: boolean

ChatMessage
├── roomId: String
├── senderId: String
├── senderName: String
├── content: String
└── timestamp: Instant

VideoState
├── playing: boolean
├── currentTime: double
├── videoUrl: String
└── lastUpdatedAt: Instant

VoiceState
├── participantId: String
└── muted: boolean
```

---

## RoomService

```java
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    // Create a new room with the given creator as host
    public Room createRoom(String creatorId, String username);

    // Return room by ID, or throw RoomNotFoundException
    public Room getRoom(String roomId);

    // Add a participant to the room
    public void addParticipant(String roomId, Participant participant);

    // Remove a participant; trigger host transfer or room destruction
    public void removeParticipant(String roomId, String participantId);

    // Assign a new host
    public void transferHost(String roomId, String newHostId);

    // Destroy room
    public void destroyRoom(String roomId);
}
```

---

## SyncService

```java
public class SyncService {

    // Update state to playing=true; broadcast to room
    public void play(String roomId, String requesterId, double currentTime);

    // Update state to playing=false; broadcast to room
    public void pause(String roomId, String requesterId, double currentTime);

    // Update currentTime; broadcast to room
    public void seek(String roomId, String requesterId, double seekTime);

    // Update videoUrl; broadcast to room
    public void updateUrl(String roomId, String requesterId, String newUrl);

    // Send current VideoState to a single user (on join)
    public void sendInitialState(String roomId, String userId);

    // Scheduled: broadcast heartbeat every 5 seconds
    @Scheduled(fixedDelay = 5000)
    public void broadcastHeartbeat();
}
```

---

## ChatService

```java
public class ChatService {

    // Validate sender is in room; attach metadata; broadcast
    public void sendMessage(String roomId, String senderId, String content);
}
```

---

## SignalingService

```java
public class SignalingService {

    // Relay a WebRTC signal (offer/answer/ICE) to the target user
    public void relay(String roomId, String fromId, String toId, SignalPayload payload);
}
```

---

## PresenceService

```java
public class PresenceService {

    // Add user to room; send initial state; broadcast USER_JOINED
    public void join(String roomId, Participant participant);

    // Remove user; broadcast USER_LEFT; trigger host transfer if needed
    public void leave(String roomId, String participantId);

    // Called by WebSocket disconnect listener
    public void handleDisconnect(String participantId);
}
```

---

## WebSocket Disconnect Listener

```java
@EventListener
public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
    String sessionId = event.getSessionId();
    // Resolve participantId from sessionId
    // Call presenceService.handleDisconnect(participantId)
}
```

---

## Guard: Host-Only Events

```java
private void assertIsHost(String roomId, String requesterId) {
    Room room = roomService.getRoom(roomId);
    if (!room.getHostId().equals(requesterId)) {
        throw new NotHostException("Only the host can perform this action");
    }
}
```

This guard is applied in `SyncService` before processing any sync events.
