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
  // Participants must be muted from the very first render to satisfy browser
  // autoplay policy. If muted=false when playing=true is received for the
  // first time, HTMLVideoElement.play() is blocked and only a thumbnail shows.
  // The host never needs muted since they interact via a user gesture (click).
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const readyRef = useRef(false);
  const playerRef = useRef(null);
  // Ref to suppress sync-triggered play/pause events from being re-broadcast
  const isSyncUpdate = useRef(false);
  // Track the latest known position from onProgress. Used as fallback when
  // getCurrentTime() isn't available yet (YouTube fires onPlay before onReady).
  const lastKnownTime = useRef(0);
  // Track if we've successfully performed the initial seek for late-joiners
  const hasInitialSeeked = useRef(false);

  const [userClickedUnmute, setUserClickedUnmute] = useState(false);

  const userId = useRoomStore(state => state.userId);
  const hostId = useRoomStore(state => state.hostId);
  const isHost = userId === hostId;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const videoUrl = useVideoStore(state => state.videoUrl);
  const playing = useVideoStore(state => state.playing);
  const currentTime = useVideoStore(state => state.currentTime);
  const lastSyncedAt = useVideoStore(state => state.lastSyncedAt);
  const { syncUrl, syncPlay, syncPause, syncSeek, syncProgress } = useSync();

  // Calculate expected current time accounting for time elapsed since the server
  // sent the sync state. This is the same calculation used in the drift detection
  // effect below.
  const elapsedSinceSync = playing ? (Date.now() - lastSyncedAt) / 1000 : 0;
  const expectedCurrentTime = currentTime + elapsedSinceSync;

  const isMuted = !isHost && !userClickedUnmute;
  const showUnmuteOverlay = !isHost && !userClickedUnmute && isReady && !!videoUrl;
  // Mirror ref so callbacks can always read the latest ready state
  // even when their closure captures a stale value.
  readyRef.current = isReady;

  // Track WebSocket connection state for UI feedback
  useEffect(() => {
    const checkConnection = () => setConnectionError(!websocketService.connected);
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  /** Safely read the player's current time. Returns fallback if unavailable. */
  const safeGetCurrentTime = (fallback = 0) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      return playerRef.current.getCurrentTime();
    }
    // Use the last known time from onProgress as fallback (handles YouTube's
    // onPlay-before-onReady quirk).
    return lastKnownTime.current || fallback;
  };

  // Continuous drift detection and smooth catch-up for non-host participants.
  // Runs on a 1-second timer so the participant self-corrects between server
  // heartbeats, keeping sync tight even when broadcasts are delayed.
  useEffect(() => {
    if (isHost || !isReady || !playerRef.current) return;

    const correctDrift = () => {
      const localTime = safeGetCurrentTime();
      if (localTime == null || isNaN(localTime)) return;

      // Calculate where the server's playhead *should be right now* by accounting
      // for the time elapsed since the latest sync message was received.
      // This is recalculated FRESH on every tick so network/jitter delays are
      // automatically absorbed — no stale closure values.
      const elapsedSinceSync = (Date.now() - lastSyncedAt) / 1000;
      const expectedServerTime = currentTime + (playing ? elapsedSinceSync : 0);

      const drift = expectedServerTime - localTime; // Positive if participant is behind
      const absDrift = Math.abs(drift);

      // Hard seek if video is paused, or if way out of sync.
      // Also force a hard seek if this is the participant's first sync and they are >0.5s behind,
      // to prevent them from starting at 0:00 and trying to "smooth catchup" for 10 seconds.
      const isInitialSync = !hasInitialSeeked.current;
      if (!playing || absDrift > 3.0 || (isInitialSync && absDrift > 0.5)) {
        if (absDrift > 0.5) {
          console.log(`Hard seeking. Drift: ${drift.toFixed(2)}s`);
          isSyncUpdate.current = true;
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(expectedServerTime, 'seconds');
          }
        }
        setPlaybackRate(1);
        if (absDrift <= 1.0) {
          hasInitialSeeked.current = true;
        }
        return;
      }

      hasInitialSeeked.current = true; // Mark initial seek done if we're naturally in sync

      // Smooth catch-up using playback speed (supported by YouTube)
      if (drift > 0.8) {
        // Participant is behind
        setPlaybackRate(1.15);
      } else if (drift < -0.8) {
        // Participant is ahead
        setPlaybackRate(0.85);
      } else if (absDrift < 0.3) {
        // Within tolerance — restore normal speed
        setPlaybackRate(1);
      }
    };

    // Run immediately on mount / deps change
    correctDrift();

    // Then run every 1s for continuous self-correction
    const interval = setInterval(correctDrift, 1000);
    return () => clearInterval(interval);
  }, [currentTime, lastSyncedAt, isHost, playing, isReady]);

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

  const calcTarget = () => {
    const { currentTime: ct, lastSyncedAt: lsa, playing: p } = useVideoStore.getState();
    const elapsed = p ? (Date.now() - lsa) / 1000 : 0;
    return ct + elapsed;
  };

  const handleReady = useCallback(() => {
    setPlayerError(null);
    console.log('ReactPlayer ready');

    // Seek late-joining participants to the current host position.
    // Reads FRESH values from the Zustand store via getState() so the seek
    // always uses the latest position — even when the YouTube iframe takes
    // 1-2s to load (the render-time closure would be stale by then).
    if (!isHost && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const target = calcTarget();
      if (target > 0) {
        console.log(`Seeking to expected position: ${target.toFixed(1)}s`);
        playerRef.current.seekTo(target, 'seconds');
        // HTML5 videos sometimes reset currentTime to 0 when autoplay initiates
        // right after onLoadedMetadata. A deferred seek overrides this behavior.
        setTimeout(() => {
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            const retarget = calcTarget();
            if (retarget > 0) {
              playerRef.current.seekTo(retarget, 'seconds');
            }
          }
        }, 150);
      }
    }

    setIsReady(true);
    readyRef.current = true;
  }, [isHost]);

  const handlePlay = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost) {
      const time = safeGetCurrentTime();
      if (time != null && !isNaN(time)) syncPlay(time);
    }
  }, [isHost, syncPlay]);

  const handlePause = useCallback(() => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost) {
      const time = safeGetCurrentTime();
      if (time != null && !isNaN(time)) syncPause(time);
    }
  }, [isHost, syncPause]);

  const handleSeeked = useCallback((event) => {
    if (isSyncUpdate.current) {
      isSyncUpdate.current = false;
      return;
    }
    if (isHost) {
      const time = safeGetCurrentTime();
      if (time != null && !isNaN(time)) syncSeek(time);
    }
  }, [isHost, syncSeek]);

  const lastSyncTime = useRef(0);
  const handleProgress = useCallback((state) => {
    // Always track the latest position (used as fallback by safeGetCurrentTime)
    lastKnownTime.current = state.playedSeconds;
    if (!isHost) return;
    const now = Date.now();
    // Host sends progress every ~2s. The backend now broadcasts immediately,
    // so participants get near-real-time position updates for tight sync.
    if (now - lastSyncTime.current > 2000) {
      lastSyncTime.current = now;
      syncProgress(state.playedSeconds);
    }
  }, [isHost, syncProgress]);

  const handleError = useCallback((error) => {
    console.error('ReactPlayer error:', error);
    setPlayerError(
      `Failed to load video. Check that the URL is correct and accessible. ` +
      `(YouTube, Vimeo, Twitch, and direct MP4 URLs are supported.)`
    );
  }, []);

  const handleUnmute = () => {
    setUserClickedUnmute(true);
  };

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
              playbackRate={playbackRate}
              controls={isHost} // Only host gets native controls
              muted={isMuted} // Participants start muted to allow autoplay
              width="100%"
              height="100%"
              onReady={handleReady}
              onPlay={handlePlay}
               onPause={handlePause}
               onSeek={handleSeeked}
               onProgress={handleProgress}
              progressInterval={1000}
              onError={handleError}
              config={{
                youtube: {
                  playerVars: {
                    disablekb: !isHost ? 1 : 0,
                    // For participants joining mid-playback, start at the expected
                    // position so YouTube doesn't flash at 0:00 before we seek.
                    ...(!isHost && expectedCurrentTime > 0
                      ? { start: Math.floor(expectedCurrentTime) }
                      : {})
                  }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            {showUnmuteOverlay && !isHost && (
              <div className="unmute-overlay" onClick={handleUnmute}>
                <button className="btn-primary unmute-btn">
                  🔇 Click to Unmute & Sync Audio
                </button>
              </div>
            )}
            {!isHost && !showUnmuteOverlay && <div className="player-overlay" />}
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
