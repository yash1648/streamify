package com.streamify.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VideoState {

    private boolean playing;
    private double currentTime;
    private String videoUrl;
    private Instant lastUpdatedAt;

    /**
     * Creates an empty video state with sensible defaults.
     * Used when a new room is created before any video is loaded.
     */
    public static VideoState empty() {
        return VideoState.builder()
                .playing(false)
                .currentTime(0.0)
                .videoUrl(null)
                .lastUpdatedAt(Instant.now())
                .build();
    }
}
