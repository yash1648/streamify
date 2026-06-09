import { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useRoomStore } from '../../stores/roomStore';
import { useVideoStore } from '../../stores/videoStore';
import { useSync } from '../../hooks/useSync';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const [inputUrl, setInputUrl] = useState('');
  const playerRef = useRef(null);
  const isReady = useRef(false);
  // Ref to suppress sync-triggered play/pause events from being re-broadcast
  const isSyncUpdate = useRef(false);

  const userId = useRoomStore(state => state.userId);
  const hostId = useRoomStore(state => state.hostId);
  const isHost = userId === hostId;

  const videoUrl = useVideoStore(state => state.videoUrl);
  const playing = useVideoStore(state => state.playing);
  const currentTime = useVideoStore(state => state.currentTime);
  const lastSyncedAt = useVideoStore(state => state.lastSyncedAt);
  const { syncUrl, syncPlay, syncPause, syncSeek } = useSync();

  // Drift detection for non-host participants
  useEffect(() => {
    if (isHost || !isReady.current || !playerRef.current) return;

    const localTime = playerRef.current.getCurrentTime();
    if (localTime == null) return;

    const drift = Math.abs(localTime - currentTime);
    if (drift > 1.5) {
      console.log(`Drift detected: local=${localTime.toFixed(1)}, remote=${currentTime.toFixed(1)}, drift=${drift.toFixed(1)}s. Seeking...`);
      isSyncUpdate.current = true;
      playerRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime, lastSyncedAt, isHost]);

  // When playing state changes from sync, mark it so onPlay/onPause don't re-broadcast
  const prevPlayingRef = useRef(playing);
  useEffect(() => {
    if (prevPlayingRef.current !== playing) {
      if (!isHost) {
        isSyncUpdate.current = true;
      }
      prevPlayingRef.current = playing;
    }
  }, [playing, isHost]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (isHost && inputUrl.trim()) {
      syncUrl(inputUrl.trim());
      setInputUrl('');
    }
  };

  const handleReady = useCallback(() => {
    isReady.current = true;
    console.log('ReactPlayer ready');
    // If we're a non-host joining after the host already set a time, seek to it
    if (!isHost && currentTime > 0 && playerRef.current) {
      playerRef.current.seekTo(currentTime, 'seconds');
    }
  }, [isHost, currentTime]);

  const handlePlay = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost && playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      if (time != null) syncPlay(time);
    }
  }, [isHost, syncPlay]);

  const handlePause = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost && playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      if (time != null) syncPause(time);
    }
  }, [isHost, syncPause]);

  const handleSeek = useCallback((seconds) => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost) {
      syncSeek(seconds);
    }
  }, [isHost, syncSeek]);

  const handleError = useCallback((error) => {
    console.error('ReactPlayer error:', error);
  }, []);

  return (
    <div className="video-player-wrapper glass-panel">
      {isHost && (
        <form className="url-bar" onSubmit={handleUrlSubmit}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter video URL (YouTube, MP4, etc.)"
          />
          <button type="submit">Load Video</button>
        </form>
      )}

      <div className="player-container">
        {videoUrl ? (
          <>
            <ReactPlayer
              className="react-player-wrapper"
              ref={playerRef}
              url={videoUrl}
              playing={playing}
              controls={isHost} // Only host gets native controls
              width="100%"
              height="100%"
              onReady={handleReady}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onError={handleError}
              config={{
                youtube: {
                  playerVars: { disablekb: !isHost ? 1 : 0 }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            {!isHost && <div className="player-overlay" />}
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            {isHost ? 'Load a video URL to start watching' : 'Waiting for host to load a video...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
