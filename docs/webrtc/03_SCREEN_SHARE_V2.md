# Screen Share (V2)

---

## Overview

Screen sharing is a V2 feature. It allows the host to share their screen with all room participants. Screen share replaces the video player view for all users while active.

---

## Presenter Architecture

When the host starts screen sharing:

```
Host clicks "Share Screen"
        │
        ▼
getDisplayMedia({ video: true })
        │
        ▼
Browser prompts: choose screen/window/tab
        │
        ▼
Display media stream acquired
        │
        ▼
For each peer connection:
  ├── sender.replaceTrack(videoTrack)
  └── send track notification via WebSocket
        │
        ▼
Peers receive notification
        │
        ▼
Peers hide VideoPlayer
  └── Show screen share <video> element with remote stream
```

---

## Track Replacement

Screen share works by replacing the video track on existing peer connections. No new peer connections are created.

```javascript
async function startScreenShare() {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always",
      displaySurface: "monitor"
    },
    audio: false
  });

  const [videoTrack] = displayStream.getVideoTracks();

  // Replace track on all peer connections
  Object.entries(voiceStore.peers).forEach(([peerId, pc]) => {
    const sender = pc.getSenders().find(s => s.track?.kind === "video");
    if (sender) {
      sender.replaceTrack(videoTrack);
    }
  });

  // When user stops sharing (via browser UI or button)
  videoTrack.onended = () => stopScreenShare();
}
```

---

## Bandwidth Requirements

| Quality | Resolution | Bitrate | Bandwidth (per peer) |
|---|---|---|---|
| Low | 640×480 | 400 kbps | 400 kbps |
| Medium | 1280×720 | 1.5 Mbps | 1.5 Mbps |
| High | 1920×1080 | 4 Mbps | 4 Mbps |

**For 8-user room:** Presenter uploads at chosen quality × 7 peers.

---

## Bandwidth-Aware Quality Control

```javascript
// Estimate bandwidth and adjust resolution
function estimateAndAdjust(pc) {
  const stats = await pc.getStats();
  let availableBandwidth = Infinity;

  stats.forEach(report => {
    if (report.type === "candidate-pair" && report.state === "succeeded") {
      availableBandwidth = report.availableOutgoingBitrate;
    }
  });

  // Adjust encoding parameters
  const params = { scaleResolutionDownBy: 1.0 };
  if (availableBandwidth < 500000) params.scaleResolutionDownBy = 2.0;   // 540p
  else if (availableBandwidth < 2000000) params.scaleResolutionDownBy = 1.5; // 720p
  // else: 1080p

  sender.setParameters(params);
}
```

---

## Stopping Screen Share

```javascript
function stopScreenShare() {
  // Stop display track
  displayStream?.getTracks().forEach(t => t.stop());

  // Replace with null (or restore video player state)
  Object.values(voiceStore.peers).forEach(pc => {
    const sender = pc.getSenders().find(s => s.track?.kind === "video");
    if (sender) {
      sender.replaceTrack(null);
    }
  });

  // Notify room
  websocketService.publish("/app/screen.share.stop", { roomId });

  // Restore VideoPlayer on all peers
  isScreenSharing = false;
}
```

---

## UI States

| State | Host View | Peer View |
|---|---|---|
| Idle | VideoPlayer visible | VideoPlayer visible |
| Sharing | Screen share preview + "Stop Sharing" | Full-screen remote video |
| Peer joins during share | — | Auto-receives screen share track |
| Share stopped | VideoPlayer restored | VideoPlayer restored |
