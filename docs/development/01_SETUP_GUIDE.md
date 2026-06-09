# Setup Guide

---

## Prerequisites

- **Java 21+** (for Spring Boot backend)
- **Node.js 18+** (for React frontend)
- **Maven** (backend build, or use `./mvnw`)

---

## Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-org/streamify.git
cd streamify/backend

# Build the project
./mvnw clean package -DskipTests

# Run locally
java -jar target/streamify-*.jar

# Server starts at http://localhost:8080
```

### Backend Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Server port |
| `SPRING_PROFILES_ACTIVE` | `dev` | Spring profile |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allowed origins |

---

## Frontend Setup

```bash
cd streamify/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend starts at http://localhost:5173
```

### Frontend Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_BACKEND_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

---

## Local Development Topology

```
Frontend (Vite)              Backend (Spring Boot)
http://localhost:5173         http://localhost:8080
       │                             │
       │──── REST API ──────────────►│
       │◄──── JSON ─────────────────│
       │                             │
       │──── WebSocket (STOMP) ─────►│
       │◄──── Events ───────────────│
       │                             │
       │◄════ WebRTC (P2P) ═══════►│
            (between browser tabs)
```

---

## Running Both Services

### Option 1: Two terminals

```bash
# Terminal 1
cd backend && ./mvnw spring-boot:run

# Terminal 2
cd frontend && npm run dev
```

### Option 2: Using concurrently (root package.json)

```bash
npm run dev:all  # if configured in root package.json
```

---

## Verifying the Setup

1. Start backend → visit `http://localhost:8080/health` → expect `{"status":"UP"}`
2. Start frontend → visit `http://localhost:5173` → expect HomePage
3. Create a room → expect redirect to `/room/{id}`
4. Open a second browser tab → join the room → expect both tabs in same room

---

## Production Build

### Frontend

```bash
cd frontend
npm run build
# Output: dist/
```

### Backend

```bash
cd backend
./mvnw clean package -DskipTests
# Output: target/streamify-*.jar
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| WebSocket won't connect | CORS or origin mismatch | Check `ALLOWED_ORIGINS` |
| Room creation fails | Backend not running | Check `http://localhost:8080/health` |
| Voice not working | No mic permission | Check browser permission settings |
| Peers not showing up | STOMP subscription issue | Check WebSocket topic path |
| Build fails (frontend) | Node version mismatch | Use Node 18+ |
