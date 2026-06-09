# V3 Features — Detailed Specification

---

## Rust Backend

See `RUST_MIGRATION_PLAN.md` for the complete migration plan.

### Rationale

- WebRTC signaling and sync engine are latency-sensitive
- Rust provides predictable performance with zero-cost abstractions
- Improved resource utilization for larger rooms (8+ users)
- Target: Axum or Actix-web framework

---

## Screen Share Optimization

### Adaptive Bitrate

In V3, screen share bitrate adapts dynamically to network conditions:

```rust
// Rust-based bandwidth estimator
struct BandwidthEstimator {
    rtt_history: VecDeque<Duration>,
    loss_rate: f64,
    estimated_bw: u64,  // bits per second
}

impl BandwidthEstimator {
    fn on_rtcp_report(&mut self, report: &RtcpReport) {
        self.rtt_history.push_back(report.rtt);
        if self.rtt_history.len() > 100 {
            self.rtt_history.pop_front();
        }
        self.loss_rate = report.packet_loss_rate;
        self.estimated_bw = self.calculate();
    }

    fn calculate(&self) -> u64 {
        // Google congestion control algorithm variant
        let avg_rtt = self.rtt_history.iter().sum::<Duration>() / self.rtt_history.len() as u32;
        // ... bandwidth estimation logic
    }
}
```

### Per-Frame Delta Encoding

- Only transmit changed regions of the screen
- Use Rust-based encoder for efficient delta detection
- Fall back to full frames on scene change

### Hardware Acceleration

- Use VAAPI (Linux) / DXVA (Windows) for encoding
- Rust bindings to FFmpeg for hardware codec access
- Automatic fallback to software encoding

---

## File Transfer

### Architecture

File transfer uses WebRTC DataChannel (SCTP-based) for peer-to-peer delivery.

```
Sender                              Receiver
  │                                    │
  │  Offer DataChannel                  │
  │───────────────────────────────────►│
  │                                    │
  │  File chunked into 16KB messages   │
  │───────────────────────────────────►│
  │  ...                               │
  │───────────────────────────────────►│
  │                                    │
  │  "transfer_complete" message       │
  │───────────────────────────────────►│
```

### Protocol

```json
// File metadata (first message)
{
  "type": "file_meta",
  "fileName": "clip.mp4",
  "fileSize": 52428800,
  "mimeType": "video/mp4",
  "fileId": "file-001"
}

// Data chunk (subsequent messages)
{
  "type": "file_chunk",
  "fileId": "file-001",
  "sequence": 42,
  "data": "<base64-encoded 16KB chunk>"
}

// Completion
{
  "type": "file_complete",
  "fileId": "file-001",
  "checksum": "sha256:abc123..."
}
```

### UI

- Drag-and-drop file area in RoomPage
- Progress bar per file transfer
- Download button on received files
- Size limit: 100MB per file (V3)
- File type allowlist: `.mp4`, `.mov`, `.avi`, `.mkv`, `.jpg`, `.png`, `.gif`, `.mp3`

---

## Recording

### Architecture

Recording is **local** to each user — no server-side recording.

```javascript
// Using MediaRecorder API
async function startRecording() {
  // Capture video element + audio outputs
  const videoElement = document.getElementById("video-player");
  const audioElements = document.querySelectorAll("audio.remote-audio");

  const streams = [videoElement.captureStream(30)];
  audioElements.forEach(el => streams.push(el.srcObject));

  // Combine streams
  const combined = new MediaStream([
    ...streams.flatMap(s => s.getTracks())
  ]);

  const recorder = new MediaRecorder(combined, {
    mimeType: "video/webm;codecs=vp9,opus"
  });

  recorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    // Save as downloadable file
    saveAs(blob, "watchparty-recording.webm");
  };

  recorder.start();
}
```

### Features

- Host-only recording trigger (V3)
- Records: video player + all voice audio
- Output: WebM file (convertable to MP4)
- Local-only storage (no cloud upload)

---

## Mobile Support

### Responsive UI

- Bottom navigation bar instead of side panels
- Full-screen video player on mobile
- Slide-up chat panel (bottom sheet)
- Touch-optimized controls (larger hit targets)

### PWA

```json
// manifest.json
{
  "name": "Watch Party",
  "short_name": "WatchParty",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Service worker for offline fallback page
- Home screen install prompt
- Push notification support (for room invites)

### Touch Controls

- Tap video to show/hide controls
- Swipe left for chat panel
- Pinch-to-zoom disabled on video (prevents accidental zoom)
- Long-press for additional options (V3)

---

## Native Desktop Client

### Electron Wrapper

```json
// electron/package.json
{
  "name": "watchparty-desktop",
  "main": "main.js",
  "dependencies": {
    "electron": "^28.0.0"
  }
}
```

### Features

- System tray icon with presence status
- OS-native notifications for:
  - User joined/left room
  - Chat message (when minimized)
  - Host transfer
- Auto-launch on startup (optional)
- Keyboard shortcuts:
  - `Ctrl+M` — Mute/Unmute
  - `Ctrl+Enter` — Send message
  - `Esc` — Leave room
  - `F11` — Fullscreen video
