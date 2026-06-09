# Streamify — Project Overview

## Vision

Create a free watch-party platform allowing friends to watch synchronized content while communicating through voice and chat.

---

## Primary Goals

- **Zero monthly cost** — fully free to host and run
- **Low latency** — near-real-time synchronization
- **Voice communication** — WebRTC-powered in-room voice
- **Video synchronization** — play, pause, seek kept in sync across all peers
- **Room-based architecture** — isolated, ephemeral rooms per session
- **Easy sharing** — simple room links, no account required

---

## Non-Goals

- Video conferencing or screen-as-camera streams
- Enterprise meetings or team collaboration
- Session recording or replay
- Large-scale public streams (100+ users)

---

## Target Users

| Segment | Use Case |
|---|---|
| Friend groups | Watching movies or shows together remotely |
| Gaming communities | Watching streams or replays in sync |
| Study groups | Shared educational video sessions |

---

## Supported Room Size

**2–8 users** per room (V1 target)

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Spring Boot |
| Realtime | WebSocket (STOMP) |
| Voice | WebRTC Mesh |
| Media Player | React Player |
| Storage | In-Memory (server-side) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Versions

| Version | Focus |
|---|---|
| V1 | MVP — Room, Chat, Sync, Voice |
| V2 | Screen Share, Host Controls, Invites |
| V3 | Rust backend, Mobile, Recording |
