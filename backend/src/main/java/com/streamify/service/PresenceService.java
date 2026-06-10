package com.streamify.service;

import com.streamify.exception.RoomNotFoundException;
import com.streamify.model.Participant;
import com.streamify.model.Room;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    // Track session ID to participant ID mapping
    private final Map<String, SessionInfo> sessionMap = new ConcurrentHashMap<>();

    private record SessionInfo(String roomId, String participantId) {}

    public void join(String roomId, Participant participant, String sessionId) {
        Room room = roomService.getRoom(roomId);
        roomService.addParticipant(roomId, participant);

        // Remove any stale session for the same user in this room (handles tab re-join)
        sessionMap.entrySet().removeIf(entry ->
                entry.getValue().roomId().equals(roomId)
                        && entry.getValue().participantId().equals(participant.getId())
        );
        sessionMap.put(sessionId, new SessionInfo(roomId, participant.getId()));

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "USER_JOINED");
        payload.put("userId", participant.getId());
        payload.put("username", participant.getUsername());
        payload.put("participants", room.getParticipants().values());

        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
        log.info("Broadcast USER_JOINED for {} in room {}", participant.getId(), roomId);

        // Send initial sync state to the joining user.
        // Uses sessionId (which matches the Principal name set in StompSessionInterceptor)
        // so that convertAndSendToUser can correctly route the message.
        Map<String, Object> syncPayload = new HashMap<>();
        syncPayload.put("type", "SYNC_STATE");
        syncPayload.put("playing", room.getVideoState().isPlaying());
        syncPayload.put("currentTime", room.getVideoState().getCurrentTime());
        syncPayload.put("videoUrl", room.getVideoState().getVideoUrl());
        syncPayload.put("timestamp", room.getVideoState().getLastUpdatedAt().toEpochMilli());

        messagingTemplate.convertAndSendToUser(sessionId, "/queue/sync", syncPayload);
    }

    public void leave(String roomId, String participantId, String sessionId) {
        Room room;
        try {
            room = roomService.getRoom(roomId);
        } catch (RoomNotFoundException e) {
            return; // Room already destroyed or doesn't exist
        }

        String oldHostId = room.getHostId();
        roomService.removeParticipant(roomId, participantId);
        if (sessionId != null) {
            sessionMap.remove(sessionId);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "USER_LEFT");
        payload.put("userId", participantId);
        
        try {
            // Need to fetch again because removeParticipant might have destroyed it
            room = roomService.getRoom(roomId);
            payload.put("participants", room.getParticipants().values());
            messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
            
            // Check if host transferred
            if (!oldHostId.equals(room.getHostId())) {
                Map<String, Object> hostPayload = new HashMap<>();
                hostPayload.put("type", "HOST_TRANSFERRED");
                hostPayload.put("newHostId", room.getHostId());
                messagingTemplate.convertAndSend("/topic/room/" + roomId, hostPayload);
            }
        } catch (RoomNotFoundException e) {
            // Room was destroyed, no need to broadcast
        }
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headers.getSessionId();

        SessionInfo info = sessionMap.get(sessionId);
        if (info != null) {
            log.info("Handling disconnect for session {} (User: {}, Room: {})", sessionId, info.participantId(), info.roomId());
            leave(info.roomId(), info.participantId(), sessionId);
        }
    }
}
