# Testing Strategy

---

## Overview

Testing is done at three levels: unit, integration, and manual. Automated testing focuses on backend logic and WebSocket event handling. Frontend testing covers component rendering and hook behaviour.

---

## Backend Testing

### Framework: JUnit 5 + Mockito

### Unit Tests

Target: Services, models, guards.

| Test | What it covers |
|---|---|
| `RoomService.createRoom_ValidInput_CreatesRoom` | Room creation success |
| `RoomService.createRoom_MissingFields_Throws` | Validation |
| `RoomService.addParticipant_ValidJoin_AddsToList` | Participant management |
| `RoomService.removeParticipant_LastLeaves_DestroysRoom` | Room destruction |
| `RoomService.removeParticipant_HostLeaves_TransfersHost` | Host transfer |
| `RoomService.getRoom_NotFound_Throws404` | Error path |
| `SyncService.play_ByHost_UpdatesState` | Sync authority |
| `SyncService.play_ByNonHost_Ignored` | Host guard |
| `SyncService.pause_ByHost_UpdatesState` | Sync authority |
| `PresenceService.join_NewUser_BroadcastsJoined` | Presence events |
| `PresenceService.leave_UserLeaves_BroadcastsLeft` | Presence events |
| `SignalingService.relay_ValidSignal_RoutesToTarget` | Signal routing |
| `SignalingService.relay_InvalidTarget_SilentlyDropped` | Error handling |

### Integration Tests

Target: WebSocket event flow via `@SpringBootTest`.

| Test | What it covers |
|---|---|
| `WebSocketFlow.createAndJoinRoom_Completes` | Full room lifecycle |
| `WebSocketFlow.hostPlaysVideo_PeersReceiveSync` | Sync broadcast |
| `WebSocketFlow.userSendsMessage_AllReceiveIt` | Chat broadcast |
| `WebSocketFlow.hostTransfersOnDisconnect_NewHostAssigned` | Host transfer |
| `WebSocketFlow.offerAnswer_SignalingRelayed` | WebRTC signaling |

---

## Frontend Testing

### Framework: Vitest + React Testing Library

### Unit Tests

Target: Zustand stores, services.

| Test | What it covers |
|---|---|
| `roomStore.setRoom_UpdatesState` | Store actions |
| `roomStore.addParticipant_AppendsToList` | Participant update |
| `chatStore.addMessage_AppendsToMessages` | Message history |
| `syncStore.setSyncState_UpdatesPlayback` | Sync state update |
| `roomService.createRoom_ReturnsRoomId` | API call |
| `roomService.getRoom_ValidId_ReturnsMetadata` | API call |
| `webrtcService.createPeerConnection_ReturnsConnection` | Peer connection |

### Component Tests

| Test | What it covers |
|---|---|
| `HomePage renders create and join forms` | Render |
| `RoomPage shows video player when joined` | Render with state |
| `ChatPanel displays messages from store` | Data display |
| `ChatPanel sends message on submit` | User interaction |
| `UserList shows all participants` | Data display |
| `UserList marks host with badge` | Conditional rendering |
| `VoiceControls shows mute when connected` | Conditional rendering |
| `CreateRoomForm calls API on submit` | Form submission |

### Hook Tests (with mocked WebSocket)

| Test | What it covers |
|---|---|
| `useRoom joins room on mount` | Lifecycle |
| `useSync updates store on SYNC_STATE` | WebSocket -> store |
| `useChat adds message on MESSAGE_RECEIVED` | WebSocket -> store |
| `usePresence updates participants on USER_JOINED` | WebSocket -> store |

---

## WebSocket Testing

WebSocket behaviour is tested at the integration level with a STOMP test client.

```java
@SpringBootTest(webEnvironment = WebSocketStomp)
class WebSocketFlowTest {

    @Test
    void testPlayPauseFlow() {
        // Given: two users in a room
        StompSession userA = connect("user-001", "room-1");
        StompSession userB = connect("user-002", "room-1");

        // When: host plays
        userA.send("/app/sync.play", playPayload(55.5));

        // Then: both receive SYNC_STATE
        assertSyncState(userA, true, 55.5);
        assertSyncState(userB, true, 55.5);
    }
}
```

---

## WebRTC Testing

WebRTC is tested manually in browser due to its dependency on browser APIs and media devices.

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Voice join | Click "Join Voice" | Mic permission prompt |
| Voice works | Speak into mic | Others hear audio |
| Mute | Click mute | Others stop hearing |
| Unmute | Click mute again | Others hear again |
| Leave voice | Click "Leave Voice" | Peer count decreases |
| 8-user room | Open 8 tabs, all join voice | All hear each other |
| Reconnect | Kill WebSocket, wait 5s | Voice resumes |
| NAT traversal | Test from different networks | Connection establishes |

---

## Test Commands

```bash
# Backend tests
cd backend && ./mvnw test

# Backend specific test
cd backend && ./mvnw test -Dtest=RoomServiceTest

# Frontend tests
cd frontend && npm test

# Frontend coverage
cd frontend && npm test -- --coverage
```

---

## Test Coverage Targets

| Module | Coverage Target |
|---|---|
| Backend Services | 90%+ |
| Backend Controllers | 80%+ |
| Frontend Stores | 90%+ |
| Frontend Hooks | 80%+ |
| Frontend Components | 70%+ |
