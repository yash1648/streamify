package com.streamify.service;

import com.streamify.exception.RoomNotFoundException;
import com.streamify.model.Participant;
import com.streamify.model.Room;
import com.streamify.model.VideoState;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RoomService {

    // In-memory room storage
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    /**
     * Create a new room with a short 6-character ID.
     */
    public Room createRoom(String creatorId, String username, String roomName) {
        String roomId = generateShortCode();
        while (rooms.containsKey(roomId)) {
            roomId = generateShortCode(); // Ensure uniqueness
        }

        Room room = Room.builder()
                .id(roomId)
                .hostId(creatorId)
                .roomName(roomName)
                .participants(new ConcurrentHashMap<>())
                .videoState(VideoState.empty())
                .createdAt(Instant.now())
                .build();

        rooms.put(roomId, room);
        log.info("Created room with id: {}", roomId);
        return room;
    }

    public Room getRoom(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            throw new RoomNotFoundException("Room not found with ID: " + roomId);
        }
        return room;
    }

    public void addParticipant(String roomId, Participant participant) {
        Room room = getRoom(roomId);
        room.getParticipants().put(participant.getId(), participant);
        log.info("Added participant {} to room {}", participant.getId(), roomId);
    }

    public void removeParticipant(String roomId, String participantId) {
        Room room = rooms.get(roomId);
        if (room == null) return;

        room.getParticipants().remove(participantId);
        log.info("Removed participant {} from room {}", participantId, roomId);

        if (room.getParticipants().isEmpty()) {
            destroyRoom(roomId);
        } else if (room.getHostId().equals(participantId)) {
            transferHostAuto(room);
        }
    }

    private void transferHostAuto(Room room) {
        Participant newHost = room.getParticipants().values().stream()
                .min(Comparator.comparing(Participant::getJoinedAt))
                .orElse(null);

        if (newHost != null) {
            room.setHostId(newHost.getId());
            log.info("Transferred host of room {} to participant {}", room.getId(), newHost.getId());
        }
    }

    public void destroyRoom(String roomId) {
        rooms.remove(roomId);
        log.info("Destroyed room: {}", roomId);
    }

    public int getActiveRoomsCount() {
        return rooms.size();
    }

    private String generateShortCode() {
        return UUID.randomUUID().toString().substring(0, 6).toLowerCase();
    }
}
