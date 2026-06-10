import { create } from 'zustand';

export const useVideoStore = create((set) => ({
  videoUrl: null,
  playing: false,
  currentTime: 0,
  lastSyncedAt: Date.now(),

  setVideoUrl: (url) => set({ videoUrl: url }),
  setPlaying: (isPlaying) => set({ playing: isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setSyncState: (state) => set({
    videoUrl: state.videoUrl,
    playing: state.playing,
    currentTime: state.currentTime,
    lastSyncedAt: Date.now()
  })
}));
