import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    websocketService.connect(
      () => {
        isConnectedRef.current = true;
        setIsConnected(true);
      },
      (error) => {
        isConnectedRef.current = false;
        setIsConnected(false);
        console.error('WebSocket connection error:', error);
      }
    );

    return () => {
      // Don't disconnect globally; RoomPage handles disconnect on leave
    };
  }, []);

  const subscribe = useCallback((destination, callback) => {
    if (isConnectedRef.current) {
      return websocketService.subscribe(destination, callback);
    }
    return null;
  }, [isConnected]); // isConnected in deps so useRoom re-fires when it changes

  const publish = useCallback((destination, body) => {
    if (isConnectedRef.current) {
      websocketService.publish(destination, body);
    }
  }, [isConnected]); // same here

  return { isConnected, subscribe, publish };
};
