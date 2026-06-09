import { useEffect, useRef } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useChatStore } from '../stores/chatStore';
import { useVideoStore } from '../stores/videoStore';
import { websocketService } from '../services/websocketService';

export const useRoom = (roomId) => {
  const userId = useRoomStore(state => state.userId);
  const username = useRoomStore(state => state.username);
  const setParticipants = useRoomStore(state => state.setParticipants);
  const setHost = useRoomStore(state => state.setHost);

  // Use refs to avoid stale closures and prevent effect re-runs
  const userIdRef = useRef(userId);
  const usernameRef = useRef(username);
  userIdRef.current = userId;
  usernameRef.current = username;

  useEffect(() => {
    if (!roomId || !userIdRef.current) return;

    // Wait for WebSocket to be connected before subscribing
    const setup = () => {
      if (!websocketService.connected) {
        // Not connected yet, wait for it
        return;
      }

      // Subscribe to room topic
      const topicSub = websocketService.subscribe(`/topic/room/${roomId}`, (message) => {
        switch (message.type) {
          case 'USER_JOINED':
          case 'USER_LEFT':
            if (message.participants) {
              useRoomStore.getState().setParticipants(message.participants);
            }
            break;
          case 'HOST_TRANSFERRED':
            useRoomStore.getState().setHost(message.newHostId);
            break;
          case 'CHAT_MESSAGE':
            if (message.message) {
              useChatStore.getState().addMessage(message.message);
            }
            break;
          case 'SYNC_STATE':
            useVideoStore.getState().setSyncState(message);
            break;
          default:
            break;
        }
      });

      // Subscribe to user queue (for initial sync)
      const queueSub = websocketService.subscribe(`/user/queue/sync`, (message) => {
        if (message.type === 'SYNC_STATE') {
          console.log('Received initial sync state:', message);
          useVideoStore.getState().setSyncState(message);
        }
      });

      // Send JOIN_ROOM message
      websocketService.publish('/app/room.join', {
        roomId,
        userId: userIdRef.current,
        username: usernameRef.current
      });

      return { topicSub, queueSub };
    };

    let subs = null;

    if (websocketService.connected) {
      subs = setup();
    } else {
      // Connect and setup when ready
      websocketService.connect(() => {
        subs = setup();
      });
    }

    return () => {
      // Send LEAVE_ROOM before unmounting
      if (websocketService.connected) {
        websocketService.publish('/app/room.leave', {
          roomId,
          userId: userIdRef.current
        });
      }

      websocketService.unsubscribe(`/topic/room/${roomId}`);
      websocketService.unsubscribe(`/user/queue/sync`);
    };
  }, [roomId]); // Only re-run when roomId changes — NOT on subscribe/publish/isConnected changes
};
