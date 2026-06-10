package com.streamify.websocket;

import java.security.Principal;

/**
 * Simple Principal implementation that uses the STOMP session ID as the
 * principal name. This is required for {@code convertAndSendToUser()} to
 * work correctly — without a Principal on the session, Spring cannot resolve
 * user-specific destinations and silently drops user-queue messages.
 */
public record StompPrincipal(String name) implements Principal {

    @Override
    public String getName() {
        return name;
    }
}
