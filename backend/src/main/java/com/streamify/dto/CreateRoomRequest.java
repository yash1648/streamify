package com.streamify.dto;

import lombok.Data;

@Data
public class CreateRoomRequest {
    private String userId;
    private String username;
    private String roomName;
}
