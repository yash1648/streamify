import { useEffect } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useChatStore } from '../stores/chatStore';
import { useWebSocket } from './useWebSocket';
import { websocketService } from '../services/websocketService';

export const useRoom = (roomId) => {
  const { isConnected, subscribe, publish } = useWebSocket();
  const userId = useRoomStore(state => state.userId);
  const username = useRoomStore(state => state.username);
  const setParticipants = useRoomStore(state => state.setParticipants);
  const setHost = useRoomStore(state => state.setHost);

  useEffect(() => {
    if (!isConnected || !roomId || !userId) return;

    // Subscribe to room topic
    const topicSub = subscribe(`/topic/room/${roomId}`, (message) => {
      switch (message.type) {
        case 'USER_JOINED':
        case 'USER_LEFT':
          if (message.participants) {
            setParticipants(message.participants);
          }
          break;
        case 'HOST_TRANSFERRED':
          setHost(message.newHostId);
          break;
        case 'CHAT_MESSAGE':
          if (message.message) {
            useChatStore.getState().addMessage(message.message);
          }
          break;
        default:
          break;
      }
    });

    // Subscribe to user queue (for initial sync)
    const queueSub = subscribe(`/user/queue/sync`, (message) => {
      if (message.type === 'SYNC_STATE') {
        console.log('Received initial sync state:', message);
        // Will handle this in useSync hook later, just logging for now
      }
    });

    // Send JOIN_ROOM message
    publish('/app/room.join', {
      roomId,
      userId,
      username
    });

    return () => {
      // Send LEAVE_ROOM before unmounting
      publish('/app/room.leave', {
        roomId,
        userId
      });

      if (topicSub) websocketService.unsubscribe(`/topic/room/${roomId}`);
      if (queueSub) websocketService.unsubscribe(`/user/queue/sync`);
    };
  }, [isConnected, roomId, userId, username, subscribe, publish, setParticipants, setHost]);

};
