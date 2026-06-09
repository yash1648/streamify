package com.streamify.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Room {

    private String id;
    private String hostId;
    private String roomName;
    @Builder.Default
    private Map<String, Participant> participants = new ConcurrentHashMap<>();
    @Builder.Default
    private VideoState videoState = VideoState.empty();
    @Builder.Default
    private Instant createdAt = Instant.now();
}
