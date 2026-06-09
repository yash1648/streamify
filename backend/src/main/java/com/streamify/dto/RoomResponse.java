package com.streamify.dto;

import com.streamify.model.Participant;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Collection;

@Data
@Builder
public class RoomResponse {
    private String roomId;
    private String hostId;
    private String roomName;
    private int participantCount;
    private Collection<Participant> participants;
    private Instant createdAt;
}
