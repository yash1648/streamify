# Project Context & AI Alignment Guide

## 🎯 1. Purpose & High-Level Architecture

### Project Mission

**Streamify** is a completely free, self-hostable watch-party platform designed to allow friends to watch synchronized content (YouTube links, direct media MP4 streams, etc.) while communicating via voice and chat directly in the browser. 

The primary business and technical goal is to build an application for groups of **2–8 users** that operates at **zero monthly hosting costs** while providing near-real-time synchronization and low-latency P2P voice communications.

### Architectural Philosophy

* **Free Forever Constraint:** The project must never introduce recurring bandwidth, media streaming, database, or SaaS infrastructure fees. All deployments are targeted at free tiers (e.g., Vercel for frontend and Render.com for backend).
* **Server-Light, Stateless Architecture:** The Spring Boot backend acts purely as a coordinator, metadata server, and WebRTC signaling relay. It holds room states entirely in-memory using `ConcurrentHashMap`. There is no persistent database.
* **P2P-First Design (WebRTC Full Mesh):** Instead of using expensive media servers (SFU or MCU) that route high-bandwidth video/audio streams, Streamify implements a WebRTC mesh. Browsers establish direct peer-to-peer connections with every other browser in the room. This shifts 100% of video, audio, and screen-sharing bandwidth directly to the clients, keeping backend infrastructure lightweight and completely free.
* **Host Authority Model:** To prevent playback drift and sync conflicts, the room creator is designated as the Host. Only the host can play, pause, seek, or change the video URL. These actions are synchronized across all peers via WebSocket.

### System Architecture

```
                               ┌─────────────────────────┐
                               │  Spring Boot Backend    │
                               │   (Render.com /ws)      │
                               └─────────────────────────┘
                                   ▲                 ▲
                                   │                 │
                           STOMP   │                 │   STOMP
                       WebSockets  │                 │  WebSockets
                                   ▼                 ▼
                       ┌──────────────┐           ┌──────────────┐
                       │   Browser    │◄─────────►│   Browser    │
                       │   (User A)   │  WebRTC   │   (User B)   │
                       └──────────────┘   Mesh    └──────────────┘
```

1. **REST Endpoints:** Used to perform room creation (`POST /rooms`) and check health/metadata.
2. **WebSocket (STOMP over SockJS) Layer:** Enables client-to-server (`/app`) communication and server-to-client broadcasts. Handles room presence events, text messages, playback sync events, and peer-to-peer WebRTC signaling (relaying SDP offers, answers, and ICE candidates).
3. **WebRTC Mesh Connection:** Active peers in a room establish direct `RTCPeerConnection` paths with all other participants for real-time audio and voice stream exchange.

### Technology Stack

#### Backend
* **Core:** Java 21, Spring Boot 3.x, Spring Web (REST)
* **Realtime:** Spring WebSocket with STOMP message broker and SockJS fallback support
* **State Management:** In-memory `ConcurrentHashMap` inside service classes (no database)
* **Testing:** JUnit 5, Mockito

#### Frontend
* **Core:** React 18+ initialized with Vite
* **Styling:** Vanilla CSS (curated design tokens, glassmorphism, responsive styles)
* **Realtime:** `sockjs-client`, `stompjs` (or `@stomp/stompjs` client)
* **Media Player:** `react-player` (handles YouTube, Twitch, Vimeo, and direct media URLs)
* **State Management:** Zustand (for simple, clean, and react-native room, chat, and synchronization stores)
* **Voice / P2P:** Browser Native RTCPeerConnection APIs (avoiding wrapper libraries where possible for clean mesh control)

#### Networking
* **WebRTC STUN:** Google STUN servers (`stun:stun.l.google.com:19302`)
* **WebRTC TURN:** Open Relay TURN fallback for users behind symmetric NATs

---

## 🛠️ 2. Current Implementation State (What is Done)

The project is currently in the **Initial Specification Phase**. All design specifications and architectural guidelines are finalized, but the codebase folders are currently empty, waiting for Sprint 1 initialization.

### Backend
* **Existing Endpoints:** None (structure planned but not generated yet).
* **Existing Events:** STOMP events defined (see `/docs/backend/03_WEBSOCKET_EVENTS.md`).
* **Existing Room State:** Class structures and Map layout defined in low-level design (see `/docs/backend/02_BACKEND_LLD.md`).

### Frontend
* **Existing Pages & Components:** None (folders and boilerplate to be initialized).
* **Existing Hooks:** State structure defined (see `/docs/frontend/03_STATE_MANAGEMENT.md`).

### Synchronization Engine
* **Current Implementation:** Theoretical drift-detection specification completed. Heartbeat broadcasts are scheduled to run every 5 seconds from the backend to ensure late joiners sync with the host's playhead position.

### WebRTC Layer
* **Current Peer Architecture:** Multi-peer connection sequence specified (see `/docs/webrtc/01_SIGNALING_FLOW.md`). Connection logic operates in a full mesh pattern, sending target-directed offers and answers relayed via private client channels on the backend (`/user/{userId}/queue/signal`).

### Chat System
* **Current Implementation:** Planned STOMP relay events (`/app/chat.send` broadcasting to `/topic/room/{roomId}`).

### Screen Sharing
* **Current Implementation:** Planned for V2.

### Voice Chat
* **Current Implementation:** Mesh peer connection lifecycle planned for Sprint 4.

### Known Limitations
* **Zero Active Code:** The backend and frontend directories have not been instantiated yet.
* **No Database/Persistence:** All rooms will be deleted automatically if the backend server restarts. Rooms are also automatically destroyed when the last participant leaves the room.

---

## 📌 3. Strict Coding Standards & AI Constraints

### Architectural Rules

* **Preserve Free-First Architecture:** Under no circumstances should databases (SQL/NoSQL) or paid SaaS solutions (like Pusher, Twilio, or video/audio SFUs) be introduced. 
* **Never Route Media Through Backend:** Video, audio, or screen streams must flow exclusively via WebRTC P2P mesh pathways. The backend must only relay signaling packets.
* **Keep Backend Stateless:** Store room states only in-memory. If data persistence is needed later, it must reside in the clients (e.g., localStorage) or be explicitly requested.
* **Prefer Browser-Native APIs:** Utilize native `RTCPeerConnection` for WebRTC mesh implementation rather than heavy wrapper packages to ensure total control of track management and audio configurations.

### Coding Standards

#### Backend (Java/Spring Boot)
* **Package Structure:** Use package names starting with `com.streamify` (e.g. `com.streamify.controller`, `com.streamify.service`, `com.streamify.model`, `com.streamify.websocket`).
* **Injection Pattern:** Favor constructor injection instead of field injection (`@Autowired`).
* **Error Handling:** Define custom exceptions (`RoomNotFoundException`, `NotHostException`) mapping to specific HTTP status codes or STOMP error channels.
* **Logging:** Use Lombok's `@Slf4j` for structured log printing.

#### Frontend (React)
* **Components:** Functional components with custom hooks. No class components.
* **State Management:** Use Zustand stores (e.g., `useRoomStore`, `useChatStore`) instead of Prop-drilling.
* **Styling:** Vanilla CSS with custom utility variables. Avoid standard TailwindCSS unless requested. Maintain a sleek, modern glassmorphic look with Outfit or Inter typography.
* **Naming Conventions:** PascalCase for components (e.g., `VideoPlayer.jsx`), camelCase for hooks (e.g., `useRoom.js`), and camelCase for stores/utilities.

### Git Workflow

* **Commit After Each Logical Change:** Always stage and commit changes after completing a logical unit of work (e.g., implementing a component, adding an endpoint, writing tests for a module). Do not batch unrelated changes into a single commit.
* **Before Committing:** Run `git status`, `git diff`, and `git log --oneline -10` to inspect what is staged and understand the recent commit history. Only stage intended files — never commit secrets, environment files, or build artifacts.
* **Commit Message Style:** Write concise, descriptive commit messages that match the project's scope. Use the imperative mood (e.g., "Add room creation REST endpoint" not "Added room creation" or "Fixes"). Prefix with the sprint or feature area when relevant (e.g., "Sprint 1: Scaffold Spring Boot backend" or "Chat: Implement message broadcasting").
* **No Force Push or Amend Without Request:** Do not use `git push --force` or `git commit --amend` unless explicitly instructed by the user.
* **Handle Commit Failures:** If a commit hook rejects the commit (e.g., lint or test failure), fix the underlying issue and create a **new** commit. Do not amend the failed commit.
* **Pull Requests:** Before creating a PR, inspect the diff against the base branch, verify no unintended files are included, and review all commits in the PR (not just the latest). Return the PR URL when done.

---

## 🗺️ 4. Sequential Development Roadmap (Next Tasks)

### Step 1: Sprint 1 — Room Creation & Workspace Setup
* **Objective:** Initialize backend Spring Boot application and React frontend boilerplate, implement the room creation API, and set up basic WebSocket (STOMP) connections.
* **Why:** This sets up the workspace, allows routing, and forms the fundamental real-time network link.
* **Dependencies:** None.
* **Implementation Strategy:** 
  1. Generate Spring Boot structure using Maven under the `backend` folder. Include websocket/web starter dependencies.
  2. Implement `RoomService` using `ConcurrentHashMap<String, Room>` to handle room creation and joining.
  3. Create `RoomController` REST endpoints (`POST /rooms`, `GET /rooms/{id}`, `GET /health`).
  4. Scaffold React frontend under the `frontend` folder using Vite, setting up the basic router (`/` and `/room/:roomId`) and a SockJS websocket connection hook.
* **Success Criteria:** A room can be created via REST request, a user can navigate to `/room/{id}`, and a WebSocket connection is successfully established.

### Step 2: Sprint 2 — Chat System
* **Objective:** Implement real-time text chat in rooms.
* **Why:** Provides text-based communication and verifies websocket messaging functionality.
* **Dependencies:** Sprint 1 WebSocket connectivity.
* **Implementation Strategy:**
  1. Add STOMP message handler `/app/chat.send` in backend `WebSocketController` which routes messages to `/topic/room/{roomId}` via `ChatService`.
  2. Create Zustand `chatStore` on the frontend.
  3. Build `ChatPanel`, `MessageList`, and `MessageInput` React components with professional styling and scroll-to-bottom behavior.
* **Success Criteria:** Typing a message and pressing enter displays the message in real time to all users connected to the same room.

### Step 3: Sprint 3 — Video Synchronization
* **Objective:** Implement synchronized media playback driven by the Host.
* **Why:** Core watch-party feature enabling shared video experiences.
* **Dependencies:** Sprint 1 and 2.
* **Implementation Strategy:**
  1. Integrate `react-player` into the frontend room viewport.
  2. Define playback sync websocket destinations (`/app/sync.play`, `/app/sync.pause`, `/app/sync.seek`, `/app/sync.url`).
  3. Apply the host-only event guard `assertIsHost` on the backend `SyncService` before broadcasting `SYNC_STATE` events.
  4. Write drift-detection on the clients (if client playhead drifts by >1.5 seconds from host broadcast position, perform automatic seek).
* **Success Criteria:** Only the host can play/pause/seek a video or change the URL, and all other connected users update their playheads and video state within <500ms.

### Step 4: Sprint 4 — WebRTC Voice Chat
* **Objective:** Enable multi-user voice communication via WebRTC full mesh.
* **Why:** Real-time speech makes watching together interactive.
* **Dependencies:** Sprint 1 WebSocket signaling channels.
* **Implementation Strategy:**
  1. Set up backend signaling relay endpoint `/app/signal` routing `OFFER`, `ANSWER`, and `ICE_CANDIDATE` payloads to target user queues (`/user/{targetId}/queue/signal`).
  2. On the frontend, write a signaling state machine inside a custom hook (`useVoice.js`) that spawns an `RTCPeerConnection` for every other participant when `USER_JOINED` is received.
  3. Attach local media stream tracks to all peer connections, and render remote audio tracks dynamically.
* **Success Criteria:** Connected peers can hear each other speaking with low latency. Mute and unmute toggles work correctly.

### Step 5: Sprint 5 — Reconnect Handling & Edge Cases
* **Objective:** Make connections resilient to transient network drops and handle host transfers cleanly.
* **Why:** Prevents room crashes if a user or host drops connection momentarily.
* **Dependencies:** Sprints 1–4.
* **Implementation Strategy:**
  1. Implement client-side WebSocket retry loop with a exponential backoff.
  2. Write backend disconnect listener (`SessionDisconnectEvent`) that triggers `PresenceService.handleDisconnect()` to clean up.
  3. If the host leaves, trigger a host transfer to the next oldest participant (`HOST_TRANSFERRED` event broadcast) instead of destroying the room.
* **Success Criteria:** Disconnected users rejoin within 5 seconds without user intervention, and the room host transfers smoothly if the host closes their browser tab.

---

## 🔍 5. Reference Files & Entry Points

All architectural guidelines and requirements specifications reside under the `docs` folder:

* **[Project Overview](file:///home/grim/Projects/multi-player/docs/00_PROJECT_OVERVIEW.md):** Vision, tech stack, and goals.
* **[Product Requirements](file:///home/grim/Projects/multi-player/docs/01_PRODUCT_REQUIREMENTS.md):** User requirements, sizing constraints, latency targets.
* **[V1 Roadmap](file:///home/grim/Projects/multi-player/docs/02_V1_ROADMAP.md):** Sprint goals and timeline.
* **[System Architecture](file:///home/grim/Projects/multi-player/docs/architecture/01_SYSTEM_ARCHITECTURE.md):** Network topographies and deployment details.
* **[Backend Architecture](file:///home/grim/Projects/multi-player/docs/architecture/02_BACKEND_ARCHITECTURE.md):** Spring package mapping and module responsibilities.
* **[Frontend Architecture](file:///home/grim/Projects/multi-player/docs/architecture/03_FRONTEND_ARCHITECTURE.md):** React router, page outlines, and hook directories.
* **[Signaling Flow](file:///home/grim/Projects/multi-player/docs/webrtc/01_SIGNALING_FLOW.md):** Sequence diagrams mapping WebRTC connection routing.

---

## Final AI Instructions

When future AI assistants read this file they must:

1. **Understand WHY the architecture exists** (in-memory, free, P2P mesh) before making any modifications to networking or infrastructure layers.
2. **Strictly preserve the Free Forever design principle.** Never recommend or add databases, cloud relays, paid TURN servers, or media routing servers.
3. **Follow the roadmap order.** Do not begin Sprint 3 sync engine work before Sprint 1 and 2 socket structures are validated.
4. **Extend existing systems** instead of replacing them. Always reference existing design specifications under `/docs` to align class names, endpoints, and event strings.
5. **Treat this document as the authoritative source** of project context and technical alignment.
6. **Commit after each logical change.** Stage and commit completed work (components, endpoints, tests) as discrete units. Inspect `git status` and `git diff` before committing, write clear imperative-mood messages, and never force push or amend unless explicitly asked. Follow the Git Workflow rules in Section 3.
