import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useRoomStore } from '../stores/roomStore';

export const useChat = () => {
  const { isConnected, publish } = useWebSocket();
  const roomId = useRoomStore(state => state.roomId);
  const userId = useRoomStore(state => state.userId);
  const username = useRoomStore(state => state.username);

  const sendMessage = useCallback((content) => {
    if (!isConnected || !roomId || !userId || !content.trim()) return;

    publish('/app/room.chat.send', {
      roomId,
      userId,
      username,
      content
    });
  }, [isConnected, roomId, userId, username, publish]);

  return { sendMessage };
};
