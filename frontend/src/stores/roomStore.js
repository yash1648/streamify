import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRoomStore = create(
  persist(
    (set) => ({
      roomId: null,
      hostId: null,
      roomName: null,
      participants: [],
      userId: null,
      username: null,

      setRoom: (data) => set({
        roomId: data.roomId,
        hostId: data.hostId,
        roomName: data.roomName,
        participants: data.participants || [],
      }),

      setUser: (userId, username) => set({ userId, username }),

      setParticipants: (participants) => set({ participants }),

      setHost: (hostId) => set({ hostId }),

      reset: () => set({
        roomId: null,
        hostId: null,
        roomName: null,
        participants: [],
        // We intentionally keep userId and username so they don't have to re-enter
      })
    }),
    {
      name: 'streamify-user-storage',
      partialize: (state) => ({ 
        userId: state.userId, 
        username: state.username 
      }),
    }
  )
);
