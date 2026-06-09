# Coding Standards

---

## Java Standards (Backend)

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `RoomService`, `VideoState` |
| Methods | camelCase | `createRoom()`, `broadcastHeartbeat()` |
| Variables | camelCase | `roomId`, `participantList` |
| Constants | UPPER_SNAKE | `DRIFT_THRESHOLD_SECONDS` |
| Packages | lowercase | `com.streamify.service` |

### Code Style

- Use Java 21 features where appropriate (records, pattern matching, sealed classes)
- Prefer constructor injection over field injection
- Use `@Service`, `@Controller` stereotypes — avoid XML config
- Use `@Scheduled` for periodic tasks (heartbeat)
- Throw custom exceptions (`RoomNotFoundException`, `NotHostException`)
- Use `@Slf4j` for logging

### Folder Structure

```
src/main/java/com/streamify/
├── controller/
├── service/
├── model/
├── websocket/
└── StreamifyApplication.java

src/main/resources/
├── application.yml
└── application-prod.yml

src/test/java/com/streamify/
├── service/
└── websocket/
```

### Testing

- JUnit 5 for unit tests
- Mockito for mocking
- `@WebMvcTest` for controller tests
- Test naming: `{MethodName}_{Scenario}_Returns{Expected}`

---

## React Standards (Frontend)

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase | `VideoPlayer`, `ChatPanel` |
| Hooks | camelCase, `use` prefix | `useRoom`, `useSync` |
| Services | camelCase | `roomService`, `websocketService` |
| Stores | camelCase, `Store` suffix | `roomStore`, `syncStore` |
| Files | PascalCase for components | `VideoPlayer.jsx` |
| Files | camelCase for utilities | `websocketService.js` |

### Code Style

- Functional components with hooks — no class components
- Destructure props and state at the top of components
- Use Zustand stores for global state — no prop drilling beyond 2 levels
- Extract business logic into custom hooks
- Use `async/await` for async operations
- No default exports — use named exports

### Folder Structure

```
src/
├── components/
│   ├── HomePage/
│   │   ├── HomePage.jsx
│   │   ├── CreateRoomForm.jsx
│   │   └── JoinRoomForm.jsx
│   └── RoomPage/
│       ├── RoomPage.jsx
│       ├── VideoPlayer.jsx
│       ├── ChatPanel.jsx
│       ├── MessageList.jsx
│       ├── MessageInput.jsx
│       ├── VoiceControls.jsx
│       └── UserList.jsx
├── hooks/
│   ├── useRoom.js
│   ├── useChat.js
│   ├── useSync.js
│   ├── useVoice.js
│   ├── useWebSocket.js
│   └── usePresence.js
├── services/
│   ├── roomService.js
│   ├── websocketService.js
│   └── webrtcService.js
├── stores/
│   ├── roomStore.js
│   ├── chatStore.js
│   ├── voiceStore.js
│   └── syncStore.js
├── App.jsx
└── main.jsx
```

---

## General Conventions

### Git Commits

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Keep commits small and focused
- Reference issues/PRs where applicable

### Error Handling

- Never silently catch errors
- Log errors with context
- Show user-friendly error messages in UI
- Graceful degradation: voice fails → chat still works

### Comments

- Comment _why_, not _what_ (the code says what)
- JSDoc/JavaDoc for public APIs and hooks
- TODO comments must include a ticket reference

### Security

- Sanitize all user input before broadcasting
- No authentication in V1 (room IDs are the access control)
- CORS restrict to known origins
- Rate limiting recommended before public deployment
