# Voice Chat

---

## Overview

Voice chat uses WebRTC audio with a full mesh topology. Each participant maintains a direct peer connection to every other participant. Audio is voice-only in V1 (no video).

---

## Audio Constraints

```javascript
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1  // mono
  },
  video: false
};
```

| Constraint | Value | Purpose |
|---|---|---|
| `echoCancellation` | true | Prevents microphone feedback |
| `noiseSuppression` | true | Reduces background noise |
| `autoGainControl` | true | Normalizes volume |
| `channelCount` | 1 (mono) | Saves bandwidth for voice |

---

## Joining Voice

When a user clicks "Join Voice":

```javascript
async function joinVoice(roomId, userId) {
  // 1. Acquire local audio
  const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
  voiceStore.setLocalStream(stream);

  // 2. Connect to each existing peer
  const participants = roomStore.participants.filter(p => p.id !== userId);
  for (const peer of participants) {
    const pc = createPeerConnection(peer.id);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    websocketService.publish("/app/signal", {
      type: "OFFER",
      roomId,
      fromId: userId,
      toId: peer.id,
      sdp: offer
    });
    voiceStore.addPeer(peer.id, pc);
  }
}
```

---

## Leaving Voice

When a user clicks "Leave Voice" or leaves the room:

```javascript
function leaveVoice() {
  // 1. Close all peer connections
  Object.values(voiceStore.peers).forEach(pc => pc.close());

  // 2. Stop local audio tracks
  voiceStore.localStream?.getTracks().forEach(track => track.stop());

  // 3. Reset store
  voiceStore.reset();
}
```

---

## Mute / Unmute

Mute is implemented locally by disabling the audio track. The peer connection remains open. No server event is sent.

```javascript
function toggleMute() {
  const enabled = !voiceStore.muted;
  voiceStore.localStream.getAudioTracks().forEach(track => {
    track.enabled = enabled;
  });
  voiceStore.setMuted(!enabled);
}
```

**Why local-only?**
- No server round-trip latency for mute/unmute
- Peers simply stop receiving audio packets
- V2 adds a WebSocket event for VAD/speaker indicators

---

## Receiving Remote Audio

When a remote track arrives via `ontrack`:

```javascript
pc.ontrack = (event) => {
  const audioElement = document.createElement("audio");
  audioElement.srcObject = event.streams[0];
  audioElement.autoplay = true;
  // Store reference for cleanup
  remoteAudioElements.set(peerId, audioElement);
};
```

Each remote peer gets its own `<audio>` element. Audio is played without a UI component — the `<audio>` elements are hidden.

---

## Speaker Detection (V2)

In V2, Voice Activity Detection (VAD) adds visual speaking indicators:

```javascript
// Using Web Audio API for VAD
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(remoteStream);
const analyser = audioContext.createAnalyser();
source.connect(analyser);

function detectSpeaking() {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  const volume = Math.max(...data) - 128;
  return volume > SPEAKING_THRESHOLD;  // threshold: ~20
}
```

---

## Voice Connection States

| State | UI Indicator | Action |
|---|---|---|
| Not joined | "Join Voice" button shown | None |
| Connecting | "Connecting..." spinner | Waiting for peer connections |
| Connected | "Connected" + mute button | Voice active |
| Muted | Mute icon toggled | Audio disabled, connection open |
| Disconnected | "Reconnecting..." | 5-second reconnect timer |
