import { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useRoomStore } from '../../stores/roomStore';
import { useVideoStore } from '../../stores/videoStore';
import { useSync } from '../../hooks/useSync';
import { websocketService } from '../../services/websocketService';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [playerError, setPlayerError] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
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

  // Track WebSocket connection state for UI feedback
  useEffect(() => {
    const checkConnection = () => setConnectionError(!websocketService.connected);
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  // Drift detection for non-host participants
  useEffect(() => {
    if (isHost || !isReady.current || !playerRef.current) return;

    const localTime = playerRef.current.currentTime;
    if (localTime == null || isNaN(localTime)) return;

    const drift = Math.abs(localTime - currentTime);
    if (drift > 1.5) {
      console.log(`Drift detected: local=${localTime.toFixed(1)}, remote=${currentTime.toFixed(1)}, drift=${drift.toFixed(1)}s. Seeking...`);
      isSyncUpdate.current = true;
      playerRef.current.currentTime = currentTime;
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
    if (!isHost || !inputUrl.trim()) return;

    // Check WebSocket connection before trying to send
    if (!websocketService.connected) {
      setConnectionError(true);
      alert('Cannot load video: WebSocket is not connected. Please wait a moment and try again.');
      return;
    }

    setPlayerError(null); // Clear previous errors
    console.log('Loading video URL:', inputUrl.trim());
    syncUrl(inputUrl.trim());
    setInputUrl('');
  };

  const handleReady = useCallback(() => {
    isReady.current = true;
    setPlayerError(null);
    console.log('ReactPlayer ready');
    // If we're a non-host joining after the host already set a time, seek to it
    if (!isHost && currentTime > 0 && playerRef.current) {
      playerRef.current.currentTime = currentTime;
    }
  }, [isHost, currentTime]);

  const handlePlay = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost && playerRef.current) {
      const time = playerRef.current.currentTime;
      if (time != null && !isNaN(time)) syncPlay(time);
    }
  }, [isHost, syncPlay]);

  const handlePause = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost && playerRef.current) {
      const time = playerRef.current.currentTime;
      if (time != null && !isNaN(time)) syncPause(time);
    }
  }, [isHost, syncPause]);

  const handleSeeked = useCallback((event) => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost && playerRef.current) {
      const time = playerRef.current.currentTime;
      if (time != null && !isNaN(time)) syncSeek(time);
    }
  }, [isHost, syncSeek]);

  const handleError = useCallback((error) => {
    console.error('ReactPlayer error:', error);
    setPlayerError(
      `Failed to load video. Check that the URL is correct and accessible. ` +
      `(YouTube, Vimeo, Twitch, and direct MP4 URLs are supported.)`
    );
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
            disabled={!websocketService.connected}
          />
          <button type="submit" disabled={!inputUrl.trim() || !websocketService.connected}>
            {websocketService.connected ? 'Load Video' : 'Connecting...'}
          </button>
        </form>
      )}

      {connectionError && videoUrl && (
        <div className="connection-warning">
          ⚠️ WebSocket disconnected — reconnecting...
        </div>
      )}

      <div className="player-container">
        {playerError && (
          <div className="player-error-overlay">
            <p className="player-error-message">{playerError}</p>
            {isHost && (
              <button className="btn-primary" onClick={() => setPlayerError(null)}>
                Dismiss
              </button>
            )}
          </div>
        )}

        {videoUrl ? (
          <>
            <ReactPlayer
              className="react-player-wrapper"
              ref={playerRef}
              src={videoUrl}
              playing={playing}
              controls={isHost} // Only host gets native controls
              width="100%"
              height="100%"
              onReady={handleReady}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeeked={handleSeeked}
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
            {isHost
              ? (connectionError ? 'Connecting to server... please wait.' : 'Enter a video URL above to start watching')
              : 'Waiting for host to load a video...'
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
