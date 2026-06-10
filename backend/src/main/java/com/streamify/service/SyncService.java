package com.streamify.service;

import com.streamify.exception.NotHostException;
import com.streamify.model.Room;
import com.streamify.model.VideoState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
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
        synchronized (state) {
            state.setVideoUrl(videoUrl);
            state.setPlaying(false); // Do not auto-play to respect browser autoplay policies
            state.setCurrentTime(0.0);
            state.setLastUpdatedAt(Instant.now());
        }
        broadcastSyncState(roomId, state, "URL_CHANGED");
        log.info("Host {} loaded video URL in room {}: {}", userId, roomId, videoUrl);
    }

    public void play(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        synchronized (state) {
            state.setPlaying(true);
            state.setCurrentTime(currentTime);
            state.setLastUpdatedAt(Instant.now());
        }
        broadcastSyncState(roomId, state, "PLAY");
        log.info("Host {} played video in room {} at {}", userId, roomId, currentTime);
    }

    public void pause(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        synchronized (state) {
            state.setPlaying(false);
            state.setCurrentTime(currentTime);
            state.setLastUpdatedAt(Instant.now());
        }
        broadcastSyncState(roomId, state, "PAUSE");
        log.info("Host {} paused video in room {} at {}", userId, roomId, currentTime);
    }

    public void seek(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        synchronized (state) {
            state.setCurrentTime(currentTime);
            state.setLastUpdatedAt(Instant.now());
        }
        broadcastSyncState(roomId, state, "SEEK");
        log.info("Host {} seeked video in room {} to {}", userId, roomId, currentTime);
    }

    public void progress(String roomId, String userId, double currentTime) {
        Room room = assertIsHost(roomId, userId);
        VideoState state = room.getVideoState();
        synchronized (state) {
            state.setCurrentTime(currentTime);
            state.setLastUpdatedAt(Instant.now());
        }
        // Broadcast immediately so participants get near-real-time position updates
        // instead of waiting for the next heartbeat (every 2s). With 2-8 users per
        // room the traffic is negligible, and the tighter loop dramatically reduces
        // perceived sync delay.
        broadcastSyncState(roomId, state, "PROGRESS");
    }

    /**
     * Periodic heartbeat that broadcasts the current video state to all participants
     * in rooms that are actively playing a video. This ensures participants receive
     * regular currentTime updates so their drift detection has fresh data to work with.
     * Without this, participants' stored currentTime goes stale and causes unnecessary
     * hard-seeks and playback-rate oscillation.
     */
    @Scheduled(fixedRate = 2000)
    public void heartbeatSync() {
        for (String roomId : roomService.getAllRoomIds()) {
            try {
                Room room = roomService.getRoom(roomId);
                VideoState state = room.getVideoState();
                // Only broadcast for rooms that are actively playing a video
                if (state.getVideoUrl() != null && state.isPlaying()) {
                    broadcastSyncState(roomId, state, "HEARTBEAT");
                }
            } catch (Exception e) {
                log.warn("Heartbeat sync error for room {}: {}", roomId, e.getMessage());
            }
        }
    }

    private void broadcastSyncState(String roomId, VideoState state, String action) {
        String videoUrl;
        boolean playing;
        double currentTime;
        long timestamp;

        synchronized (state) {
            videoUrl = state.getVideoUrl();
            playing = state.isPlaying();
            currentTime = state.getCurrentTime();
            timestamp = state.getLastUpdatedAt().toEpochMilli();
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "SYNC_STATE");
        payload.put("action", action);
        payload.put("videoUrl", videoUrl);
        payload.put("playing", playing);
        payload.put("currentTime", currentTime);
        payload.put("timestamp", timestamp);

        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
    }
}
