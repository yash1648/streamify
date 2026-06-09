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
public class Participant {

    private String id;
    private String username;
    private Instant joinedAt;
    private boolean muted;
}
