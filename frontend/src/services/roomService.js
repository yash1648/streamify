const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const roomService = {
  createRoom: async (userId, username, roomName) => {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, username, roomName }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return response.json();
  },

  getRoom: async (roomId) => {
    const response = await fetch(`${API_URL}/rooms/${roomId}`);

    if (response.status === 404) {
      throw new Error('Room not found');
    }

    if (!response.ok) {
      throw new Error('Failed to get room details');
    }

    return response.json();
  }
};
