# State Management

---

## Overview

State management uses **Zustand** — a lightweight, hook-based state management library. Each domain has its own store. Stores are updated by custom hooks in response to WebSocket events.

---

## Store Architecture

```
Zustand Stores
    │
    ├── roomStore    → room identity, participants, host
    ├── chatStore    → message history
    ├── voiceStore   → mute state, peer connections
    └── syncStore    → video playback state
```

---

## roomStore

Manages room identity and participant list.

```javascript
import { create } from "zustand";

const useRoomStore = create((set) => ({
  // State
  roomId: null,
  hostId: null,
  participants: [],

  // Actions
  setRoom: (roomId, hostId) => set({ roomId, hostId }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== userId),
    })),
  setHost: (hostId) => set({ hostId }),
  reset: () =>
    set({ roomId: null, hostId: null, participants: [] }),
}));
```

**Updated by:** `useRoom` hook (on join/leave), `usePresence` hook (on USER_JOINED/USER_LEFT/HOST_TRANSFERRED)

---

## chatStore

Manages in-room chat messages.

```javascript
import { create } from "zustand";

const useChatStore = create((set) => ({
  // State
  messages: [],

  // Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
}));
```

**Updated by:** `useChat` hook (on MESSAGE_RECEIVED)

---

## voiceStore

Manages WebRTC voice state.

```javascript
import { create } from "zustand";

const useVoiceStore = create((set) => ({
  // State
  muted: false,
  localStream: null,
  peers: {},      // { [peerId]: RTCPeerConnection }
  speakingPeers: new Set(),  // V2: VAD-detected speakers

  // Actions
  setMuted: (muted) => set({ muted }),
  setLocalStream: (stream) => set({ localStream }),
  addPeer: (peerId, connection) =>
    set((state) => ({
      peers: { ...state.peers, [peerId]: connection },
    })),
  removePeer: (peerId) =>
    set((state) => {
      const { [peerId]: _, ...rest } = state.peers;
      return { peers: rest };
    }),
  addSpeakingPeer: (peerId) =>
    set((state) => {
      const next = new Set(state.speakingPeers);
      next.add(peerId);
      return { speakingPeers: next };
    }),
  removeSpeakingPeer: (peerId) =>
    set((state) => {
      const next = new Set(state.speakingPeers);
      next.delete(peerId);
      return { speakingPeers: next };
    }),
  reset: () =>
    set({ muted: false, localStream: null, peers: {}, speakingPeers: new Set() }),
}));
```

**Updated by:** `useVoice` hook (on WebRTC events)

---

## syncStore

Manages video playback synchronization state.

```javascript
import { create } from "zustand";

const useSyncStore = create((set) => ({
  // State
  playing: false,
  currentTime: 0,
  videoUrl: null,

  // Actions
  setSyncState: (state) =>
    set({
      playing: state.playing,
      currentTime: state.currentTime,
      videoUrl: state.videoUrl,
    }),
  reset: () =>
    set({ playing: false, currentTime: 0, videoUrl: null }),
}));
```

**Updated by:** `useSync` hook (on SYNC_STATE)

---

## Store Dependency Graph

```
WebSocket Event → Hook → Store → Component
                                         
SYNC_STATE    → useSync    → syncStore    → VideoPlayer
MESSAGE_RECEIVED → useChat → chatStore    → ChatPanel
USER_JOINED   → usePresence → roomStore   → UserList
USER_LEFT     → usePresence → roomStore   → UserList
HOST_TRANSFERRED → usePresence → roomStore → UserList
```

---

## Reset Behaviour

All stores expose a `reset()` method. When a user leaves a room, every store is reset:

```javascript
function useLeaveRoom() {
  const resetRoom = useRoomStore((s) => s.reset);
  const resetChat = useChatStore((s) => s.reset);
  const resetVoice = useVoiceStore((s) => s.reset);
  const resetSync = useSyncStore((s) => s.reset);

  return () => {
    resetRoom();
    resetChat();
    resetVoice();
    resetSync();
  };
}
```
