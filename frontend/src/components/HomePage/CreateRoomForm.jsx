import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { useRoomStore } from '../../stores/roomStore';

const CreateRoomForm = () => {
  const [username, setLocalUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setRoom } = useRoomStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      // Generate a client-side userId
      const generatedUserId = crypto.randomUUID();
      setUser(generatedUserId, username);

      const roomData = await roomService.createRoom(generatedUserId, username, roomName);
      setRoom(roomData);

      navigate(`/room/${roomData.roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel form-card">
      <h2><PlusCircle size={24} color="#3b82f6" /> Create a Room</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Start a new watch party and invite your friends.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="create-username">Your Name</label>
          <input
            id="create-username"
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setLocalUsername(e.target.value)}
            placeholder="Enter your display name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="create-roomname">Room Name (Optional)</label>
          <input
            id="create-roomname"
            type="text"
            className="input-field"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g., Movie Night"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || !username.trim()}>
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoomForm;
