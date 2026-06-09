package com.streamify.controller;

import com.streamify.model.Participant;
import com.streamify.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final PresenceService presenceService;

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
}
