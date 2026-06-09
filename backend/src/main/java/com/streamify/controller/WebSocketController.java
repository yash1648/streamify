package com.streamify.controller;

import com.streamify.dto.ChatMessage;
import com.streamify.model.Participant;
import com.streamify.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/room.join")
    public void joinRoom(Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String roomId = payload.get("roomId");
        String userId = payload.get("userId");
        String username = payload.get("username");
        String sessionId = headerAccessor.getSessionId();

        log.info("Received JOIN_ROOM: user {} joining room {}", userId, roomId);

        Participant participant = Participant.builder()
                .id(userId)
                .username(username)
                .joinedAt(Instant.now())
                .muted(false)
                .build();

        presenceService.join(roomId, participant, sessionId);
    }

    @MessageMapping("/room.leave")
    public void leaveRoom(Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String roomId = payload.get("roomId");
        String userId = payload.get("userId");
        String sessionId = headerAccessor.getSessionId();

        log.info("Received LEAVE_ROOM: user {} leaving room {}", userId, roomId);

        presenceService.leave(roomId, userId, sessionId);
    }

    @MessageMapping("/room.chat.send")
    public void sendChat(ChatMessage message) {
        log.info("Received CHAT_MESSAGE in room {} from user {}", message.getRoomId(), message.getUserId());
        message.setTimestamp(Instant.now());
        
        // Wrap it in a type envelope or just send the object directly.
        // We'll send it directly, but add a 'type' field dynamically if needed.
        // Actually, we can use a Map to keep it consistent with "type: 'CHAT_MESSAGE'"
        Map<String, Object> payload = Map.of(
            "type", "CHAT_MESSAGE",
            "message", message
        );

        messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId(), payload);
    }
}
