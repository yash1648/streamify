import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    websocketService.connect(
      () => {
        setIsConnected(true);
      },
      (error) => {
        setIsConnected(false);
        console.error('WebSocket connection error:', error);
      }
    );

    return () => {
      // Depending on the design, you might not want to disconnect globally on unmount of one component
      // But for room scope, we handle disconnect in useRoom
    };
  }, []);

  const subscribe = useCallback((destination, callback) => {
    if (isConnected) {
      return websocketService.subscribe(destination, callback);
    }
    return null;
  }, [isConnected]);

  const publish = useCallback((destination, body) => {
    if (isConnected) {
      websocketService.publish(destination, body);
    }
  }, [isConnected]);

  return { isConnected, subscribe, publish };
};
