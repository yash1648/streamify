import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connected = false;
    this.connectCallbacks = [];
  }

  connect(onConnect, onError) {
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    // If already activating, just queue the callback
    if (this.client && !this.connected) {
      if (onConnect) this.connectCallbacks.push(onConnect);
      return;
    }

    if (onConnect) this.connectCallbacks.push(onConnect);

    this.client = new Client({
      // Factory must create a NEW SockJS instance each time (for reconnects)
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => {
        // Uncomment for debugging: console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket via STOMP');
      this.connected = true;
      // Fire all queued connect callbacks
      this.connectCallbacks.forEach(cb => cb());
      this.connectCallbacks = [];
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.connected = false;
      if (onError) onError(frame);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
    this.subscriptions.clear();
    this.connectCallbacks = [];
  }

  subscribe(destination, callback) {
    if (!this.client || !this.connected) {
      console.error('Cannot subscribe: STOMP client is not connected');
      return null;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      callback(JSON.parse(message.body));
    });

    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  publish(destination, body) {
    if (!this.client || !this.connected) {
      console.error('Cannot publish: STOMP client is not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }
}

export const websocketService = new WebSocketService();
