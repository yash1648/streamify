package com.streamify.controller;

import com.streamify.dto.CreateRoomRequest;
import com.streamify.dto.RoomResponse;
import com.streamify.model.Room;
import com.streamify.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping("/rooms")
    public ResponseEntity<RoomResponse> createRoom(@RequestBody CreateRoomRequest request) {
        Room room = roomService.createRoom(request.getUserId(), request.getUsername(), request.getRoomName());

        RoomResponse response = RoomResponse.builder()
                .roomId(room.getId())
                .hostId(room.getHostId())
                .roomName(room.getRoomName())
                .participantCount(room.getParticipants().size())
                .participants(room.getParticipants().values())
                .createdAt(room.getCreatedAt())
                .build();

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String id) {
        Room room = roomService.getRoom(id);

        RoomResponse response = RoomResponse.builder()
                .roomId(room.getId())
                .hostId(room.getHostId())
                .roomName(room.getRoomName())
                .participantCount(room.getParticipants().size())
                .participants(room.getParticipants().values())
                .createdAt(room.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("timestamp", Instant.now());
        response.put("activeRooms", roomService.getActiveRoomsCount());
        return ResponseEntity.ok(response);
    }
}
