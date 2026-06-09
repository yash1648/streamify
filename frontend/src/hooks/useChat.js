import { useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { useRoomStore } from '../stores/roomStore';

export const useChat = () => {
  const roomId = useRoomStore(state => state.roomId);
  const userId = useRoomStore(state => state.userId);
  const username = useRoomStore(state => state.username);

  const sendMessage = useCallback((content) => {
    if (!roomId || !userId || !content.trim()) return;

    websocketService.publish('/app/room.chat.send', {
      roomId,
      userId,
      username,
      content
    });
  }, [roomId, userId, username]);

  return { sendMessage };
};
