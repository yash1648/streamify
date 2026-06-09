package com.streamify.service;

import com.streamify.exception.NotHostException;
import com.streamify.model.Room;
import com.streamify.model.VideoState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Asserts that the given userId is the host of the given room.
     * Throws NotHostException if not.
     */
    private Room assertIsHost(String roomId, String userId) {
        Room room = roomService.getRoom(roomId);
        if (!room.getHostId().equals(userId)) {
            throw new NotHostException("Only the host can control video playback");
        }
        return room;
    }

    public void loadVideo(String roomId, String userId, String videoUrl) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        state.setVideoUrl(videoUrl);
        state.setPlaying(false);
        state.setCurrentTime(0.0);
        state.setLastUpdatedAt(Instant.now());

        broadcastSyncState(roomId, state, "URL_CHANGED");
        log.info("Host {} loaded video URL in room {}: {}", userId, roomId, videoUrl);
    }

    public void play(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        state.setPlaying(true);
        state.setCurrentTime(currentTime);
        state.setLastUpdatedAt(Instant.now());

        broadcastSyncState(roomId, state, "PLAY");
        log.info("Host {} played video in room {} at {}", userId, roomId, currentTime);
    }

    public void pause(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        state.setPlaying(false);
        state.setCurrentTime(currentTime);
        state.setLastUpdatedAt(Instant.now());

        broadcastSyncState(roomId, state, "PAUSE");
        log.info("Host {} paused video in room {} at {}", userId, roomId, currentTime);
    }

    public void seek(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        state.setCurrentTime(currentTime);
        state.setLastUpdatedAt(Instant.now());

        broadcastSyncState(roomId, state, "SEEK");
        log.info("Host {} seeked video in room {} to {}", userId, roomId, currentTime);
    }

    private void broadcastSyncState(String roomId, VideoState state, String action) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "SYNC_STATE");
        payload.put("action", action);
        payload.put("videoUrl", state.getVideoUrl());
        payload.put("playing", state.isPlaying());
        payload.put("currentTime", state.getCurrentTime());
        payload.put("timestamp", state.getLastUpdatedAt().toEpochMilli());

        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
    }
}
