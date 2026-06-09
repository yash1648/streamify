import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useRoomStore } from '../../stores/roomStore';
import { useVideoStore } from '../../stores/videoStore';
import { useSync } from '../../hooks/useSync';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const [inputUrl, setInputUrl] = useState('');
  const playerRef = useRef(null);
  // Ref to distinguish between user-initiated seeks and auto-sync seeks
  const isAutoSeeking = useRef(false);
  
  const userId = useRoomStore(state => state.userId);
  const hostId = useRoomStore(state => state.hostId);
  const isHost = userId === hostId;

  const { videoUrl, playing, currentTime, lastSyncedAt } = useVideoStore();
  const { syncUrl, syncPlay, syncPause, syncSeek } = useSync();

  // Drift detection and alignment
  useEffect(() => {
    if (!isHost && playerRef.current) {
      const currentLocalTime = playerRef.current.getCurrentTime();
      if (Math.abs(currentLocalTime - currentTime) > 1.5) {
        console.log(`Drift detected: local ${currentLocalTime}, remote ${currentTime}. Seeking...`);
        isAutoSeeking.current = true;
        playerRef.current.seekTo(currentTime, 'seconds');
      }
    }
  }, [currentTime, lastSyncedAt, isHost]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (isHost && inputUrl.trim()) {
      syncUrl(inputUrl);
      setInputUrl('');
    }
  };

  const handlePlay = () => {
    if (isHost) syncPlay(playerRef.current.getCurrentTime());
  };

  const handlePause = () => {
    if (isHost) syncPause(playerRef.current.getCurrentTime());
  };

  const handleSeek = (seconds) => {
    // If this seek was triggered programmatically (drift correction), don't broadcast it
    if (isAutoSeeking.current) {
      isAutoSeeking.current = false;
      return;
    }
    if (isHost) {
      syncSeek(seconds);
    }
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
          />
          <button type="submit">Load Video</button>
        </form>
      )}

      <div className="player-container">
        {videoUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              playing={playing}
              controls={isHost} // Only host gets native controls
              width="100%"
              height="100%"
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              config={{
                youtube: {
                  playerVars: { disablekb: !isHost ? 1 : 0 }
                }
              }}
            />
            {!isHost && <div className="player-overlay" />}
          </div>
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
