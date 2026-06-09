import { useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { useRoomStore } from '../stores/roomStore';

export const useSync = () => {
  const roomId = useRoomStore(state => state.roomId);
  const userId = useRoomStore(state => state.userId);

  const syncUrl = useCallback((videoUrl) => {
    if (!roomId || !userId || !videoUrl) return;
    websocketService.publish('/app/room.sync.url', { roomId, userId, videoUrl });
  }, [roomId, userId]);

  const syncPlay = useCallback((currentTime) => {
    if (!roomId || !userId) return;
    websocketService.publish('/app/room.sync.play', { roomId, userId, currentTime });
  }, [roomId, userId]);

  const syncPause = useCallback((currentTime) => {
    if (!roomId || !userId) return;
    websocketService.publish('/app/room.sync.pause', { roomId, userId, currentTime });
  }, [roomId, userId]);

  const syncSeek = useCallback((currentTime) => {
    if (!roomId || !userId) return;
    websocketService.publish('/app/room.sync.seek', { roomId, userId, currentTime });
  }, [roomId, userId]);

  return { syncUrl, syncPlay, syncPause, syncSeek };
};
