import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { useRoomStore } from '../../stores/roomStore';

const JoinRoomForm = () => {
  const [username, setLocalUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser, setRoom } = useRoomStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const roomData = await roomService.getRoom(roomId.trim().toLowerCase());
      
      const generatedUserId = crypto.randomUUID();
      setUser(generatedUserId, username);
      setRoom(roomData);

      navigate(`/room/${roomData.roomId}`);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Room not found. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel form-card">
      <h2><LogIn size={24} color="#a855f7" /> Join a Room</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Enter a room code to join an existing watch party.
      </p>

      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: '0.875rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="join-username">Your Name</label>
          <input
            id="join-username"
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setLocalUsername(e.target.value)}
            placeholder="Enter your display name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="join-roomid">Room Code</label>
          <input
            id="join-roomid"
            type="text"
            className="input-field"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="e.g., abc123"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || !username.trim() || !roomId.trim()} style={{ backgroundColor: '#a855f7' }}>
          {isLoading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
};

export default JoinRoomForm;
