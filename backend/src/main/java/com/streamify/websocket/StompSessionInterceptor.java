package com.streamify.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Injects a Principal (using the STOMP session ID) into every CONNECT frame.
 *
 * Without this interceptor, STOMP sessions have no Principal, which means
 * {@link org.springframework.messaging.simp.SimpMessagingTemplate#convertAndSendToUser}
 * silently drops messages because it cannot resolve any session for the target user.
 *
 * By setting the session ID as the principal name, we enable user-destination routing:
 * {@code convertAndSendToUser(sessionId, "/queue/errors", payload)} will correctly
 * deliver the message to that specific session.
 */
public class StompSessionInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String sessionId = accessor.getSessionId();
            if (sessionId != null) {
                accessor.setUser(new StompPrincipal(sessionId));
            }
        }
        return message;
    }
}
