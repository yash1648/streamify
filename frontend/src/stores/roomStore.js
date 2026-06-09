import { create } from 'zustand'

export const useRoomStore = create((set) => ({
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
}))
