import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../hooks/useRoom';
import { useRoomStore } from '../../stores/roomStore';
import { websocketService } from '../../services/websocketService';
import UserList from './UserList';
import ChatPanel from './ChatPanel';
import './RoomPage.css';

const RoomPage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  
  // Initialize room connection
  useRoom(roomId);
  
  const roomName = useRoomStore(state => state.roomName);
  const userId = useRoomStore(state => state.userId);
  const resetRoom = useRoomStore(state => state.reset);

  // If user tries to access /room/:id directly without a userId (no username), redirect to home
  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
  }, [userId, navigate]);

  const handleLeaveRoom = () => {
    // Disconnect websocket
    websocketService.disconnect();
    // Reset store
    resetRoom();
    // Navigate home
    navigate('/');
  };

  if (!userId) return null;

  return (
    <div className="room-page">
      <header className="room-header glass-panel">
        <div className="room-info">
          <h1 className="room-title">{roomName || 'Watch Party'}</h1>
          <span className="room-code-badge">{roomId}</span>
        </div>
        
        <button className="btn-danger" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </header>

      <div className="room-layout">
        <div className="main-content">
          <div className="glass-panel video-container">
            <p style={{ color: 'var(--text-secondary)' }}>Video Player Placeholder (Sprint 2)</p>
          </div>
          
          <div className="glass-panel voice-controls">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Voice Controls Placeholder (Sprint 3)</p>
          </div>
        </div>

        <div className="side-panel">
          <ChatPanel />
          
          <UserList />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
