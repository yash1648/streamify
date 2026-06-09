# Backend Architecture

---

## Overview

The backend is a single Spring Boot application. All state is held in-memory using `ConcurrentHashMap`. There is no database. Rooms are ephemeral — they exist only while the server is running.

---

## Module Map

```
com.watchparty
├── controller
│   └── RoomController.java
├── service
│   ├── RoomService.java
│   ├── ChatService.java
│   ├── SyncService.java
│   ├── SignalingService.java
│   └── PresenceService.java
├── model
│   ├── Room.java
│   ├── Participant.java
│   ├── ChatMessage.java
│   ├── VideoState.java
│   └── VoiceState.java
├── websocket
│   ├── WebSocketConfig.java
│   └── RoomWebSocketHandler.java
└── WatchPartyApplication.java
```

---

## Module Descriptions

### RoomService

**Responsibilities:**
- Create rooms with generated IDs
- Store and retrieve room state
- Trigger host transfer on host disconnect
- Destroy room when last participant leaves

**Key Classes:** `Room`, `RoomService`

**Events Published:** `ROOM_CREATED`, `ROOM_DESTROYED`

**Dependencies:** None (root service)

---

### ChatService

**Responsibilities:**
- Accept incoming chat messages from WebSocket
- Broadcast messages to all room subscribers
- Attach sender metadata (username, timestamp)

**Key Classes:** `ChatMessage`, `ChatService`

**Events Published:** `MESSAGE_RECEIVED`

**Dependencies:** `RoomService`

---

### SyncService

**Responsibilities:**
- Maintain current `VideoState` per room (playing, currentTime, URL)
- Process PLAY / PAUSE / SEEK / VIDEO_URL_UPDATE from host
- Broadcast updated state to all room participants
- Send heartbeat with current state for late joiners

**Key Classes:** `VideoState`, `SyncService`

**Events Published:** `SYNC_STATE`

**Dependencies:** `RoomService`

---

### SignalingService

**Responsibilities:**
- Relay WebRTC `OFFER`, `ANSWER`, `ICE_CANDIDATE` between peers
- Route signals to specific target participants (not broadcast)
- Handle disconnected peer cleanup

**Key Classes:** `SignalingService`

**Events Published:** `OFFER`, `ANSWER`, `ICE_CANDIDATE`

**Dependencies:** `RoomService`, `PresenceService`

---

### PresenceService

**Responsibilities:**
- Track which users are connected
- Publish `USER_JOINED` / `USER_LEFT` to room
- Trigger host transfer logic
- Maintain participant list per room

**Key Classes:** `Participant`, `PresenceService`

**Events Published:** `USER_JOINED`, `USER_LEFT`, `HOST_TRANSFERRED`

**Dependencies:** `RoomService`

---

## WebSocket Configuration

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

---

## REST Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/rooms` | Create a new room |
| GET | `/rooms/{id}` | Get room metadata |
| GET | `/health` | Health check |

---

## In-Memory Storage Strategy

All rooms are stored in:

```java
ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>();
```

- No persistence between server restarts
- Rooms auto-destroyed when empty
- Thread-safe for concurrent WebSocket connections
