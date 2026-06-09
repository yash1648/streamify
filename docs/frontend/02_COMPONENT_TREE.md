# Component Tree

---

## Full Component Hierarchy

```
App
│
├── HomePage
│   ├── CreateRoomForm
│   │   ├── TextInput (room name, optional)
│   │   └── Button ("Create Room")
│   │
│   └── JoinRoomForm
│       ├── TextInput (room ID)
│       └── Button ("Join Room")
│
└── RoomPage
    ├── VideoPlayer
    │   ├── ReactPlayer (video playback)
    │   ├── PlayPauseButton (host only)
    │   ├── SeekBar (host only)
    │   └── UrlInput (host only)
    │
    ├── ChatPanel
    │   ├── MessageList
    │   │   └── MessageBubble (per message)
    │   └── MessageInput
    │       ├── TextInput
    │       └── SendButton
    │
    ├── VoiceControls
    │   ├── MuteButton
    │   └── VoiceStatusIndicator
    │       └── SpeakingIndicator (per active speaker)
    │
    └── UserList
        └── UserCard (per participant)
            ├── Avatar (initial-based)
            ├── UsernameLabel
            ├── HostBadge (if host)
            └── SpeakingIndicator (V2, VAD)
```

---

## Component Responsibilities

### App
- Sets up React Router
- Provides global layout shell

### HomePage
- Renders create/join forms
- Handles navigation to room on success

### CreateRoomForm
- Collects optional room name
- Calls `POST /rooms` via `roomService`
- Redirects to `/room/{id}` on success

### JoinRoomForm
- Collects room ID from user
- Validates room existence via `GET /rooms/{id}`
- Redirects to `/room/{id}` on success

### RoomPage
- Root component for the watch-party experience
- Initializes WebSocket connection
- Connects all hooks (`useRoom`, `useSync`, `useChat`, `useVoice`)
- Arranges VideoPlayer, ChatPanel, VoiceControls, UserList

### VideoPlayer
- Wraps React Player
- Reads `syncStore` for playing/currentTime/videoUrl
- Disables controls for non-host users
- Shows URL input only for host

### ChatPanel
- Subscribes to chat messages via `useChat`
- Auto-scrolls to latest message
- Sends messages via WebSocket

### VoiceControls
- Shows mute/unmute toggle
- Displays voice connection status
- In V2: shows speaking indicators

### UserList
- Shows all participants in room
- Marks host with badge
- In V2: shows VAD speaking indicator

---

## Props and Data Flow

```
RoomPage
  │
  ├── roomStore → { roomId, hostId, participants }
  │     └── passed to → UserList
  │
  ├── syncStore → { playing, currentTime, videoUrl }
  │     └── passed to → VideoPlayer
  │
  ├── chatStore → { messages[] }
  │     └── passed to → ChatPanel
  │
  └── voiceStore → { muted, peers[], localStream }
        └── passed to → VoiceControls
```
