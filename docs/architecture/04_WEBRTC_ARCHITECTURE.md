# WebRTC Architecture

---

## Overview

Voice communication uses a full WebRTC mesh. Every participant opens a direct peer connection to every other participant. Signaling (offer/answer/ICE) is relayed through the Spring Boot backend via WebSocket. Media (audio) flows directly peer-to-peer.

---

## Mesh Topology

For N users in a room, each user maintains N-1 peer connections.

```
        User A
       /       \
   User B ── User C
```

- No SFU or MCU
- Maximum 7 peer connections per user in an 8-person room
- Acceptable for voice-only streams (low bandwidth)

---

## Peer Connection Lifecycle

```
[User A enters room]
        |
        v
getUserMedia() ─► get local audio stream
        |
        v
For each existing participant:
        |
        v
createPeerConnection(peerId)
        |
        v
addTrack(localStream)
        |
        v
createOffer()
        |
        v
setLocalDescription(offer)
        |
        v
send OFFER via WebSocket ──► Spring Boot ──► User B
        |
        v
User B receives OFFER
        |
        v
createPeerConnection(userAId)
addTrack(localStream)
setRemoteDescription(offer)
createAnswer()
setLocalDescription(answer)
send ANSWER ──► Spring Boot ──► User A
        |
        v
User A receives ANSWER
setRemoteDescription(answer)
        |
        v
ICE Candidates exchange (both directions)
        |
        v
onicecandidate ──► send ICE_CANDIDATE ──► Spring Boot ──► peer
peer receives ICE_CANDIDATE
addIceCandidate(candidate)
        |
        v
Connection State: CONNECTED
ontrack ──► attach remote audio stream to <audio> element
```

---

## Sequence Diagram — Offer/Answer

```
User A                  Spring Boot               User B
  |                          |                       |
  |-- OFFER (to: userB) ---> |                       |
  |                          |-- OFFER (to: userB) ->|
  |                          |                       |
  |                          |<- ANSWER (to: userA) -|
  |<- ANSWER (to: userA) ----|                       |
  |                          |                       |
  |-- ICE_CANDIDATE -------> |--- ICE_CANDIDATE ---> |
  |<- ICE_CANDIDATE ---------|<-- ICE_CANDIDATE -----|
  |                          |                       |
  |<============ Audio Stream (P2P) ================>|
```

---

## ICE Configuration

```javascript
const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
    // TURN server added in V2 for NAT traversal fallback
  ]
};
```

---

## Disconnection Handling

| Event | Action |
|---|---|
| `oniceconnectionstatechange` = `disconnected` | Start 5-second reconnect timer |
| `oniceconnectionstatechange` = `failed` | Close and recreate peer connection |
| `oniceconnectionstatechange` = `closed` | Remove peer from voice roster |
| User leaves room (WebSocket event) | Close peer connection, remove audio element |

---

## Audio Constraints

```javascript
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: false  // voice only in V1
};
```

---

## Mute / Unmute

Mute is achieved by disabling the audio track — the peer connection stays open.

```javascript
// Mute
localStream.getAudioTracks()[0].enabled = false;

// Unmute
localStream.getAudioTracks()[0].enabled = true;
```

No WebSocket event required. Mute state is local only in V1. (V2 adds VAD-based visual indicators.)
