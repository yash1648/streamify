# V3 Roadmap

---

## Goal

Re-architect performance-critical backend services in Rust, expand platform support, and add power-user features.

---

## Features

### Rust Backend

- Migrate signaling, sync, and presence services from Spring Boot to Rust
- See `future/RUST_MIGRATION_PLAN.md` for detailed migration order
- Target: Axum or Actix-web framework

### Screen Share Optimization

- Adaptive bitrate for screen share streams
- Per-frame delta encoding
- Hardware acceleration where available

### File Transfer

- Peer-to-peer file sharing via WebRTC DataChannel
- Progress tracking UI
- Size limits and file type validation

### Recording

- Optional local recording of the watch session
- Export as MP4
- Host-only recording trigger

### Mobile Support

- Responsive React UI for mobile browsers
- Touch-friendly video controls
- PWA manifest for home screen install

### Native Desktop Client

- Electron wrapper around the React frontend
- System tray presence indicator
- OS-native notifications for room events
