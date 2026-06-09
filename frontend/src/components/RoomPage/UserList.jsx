import { useRoomStore } from '../../stores/roomStore';

const UserList = () => {
  const participants = useRoomStore(state => state.participants);
  const hostId = useRoomStore(state => state.hostId);
  const currentUserId = useRoomStore(state => state.userId);

  return (
    <div className="glass-panel user-list-container">
      <h3>Participants ({participants.length})</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        {participants.map(p => (
          <div key={p.id} className="user-card">
            <div className="user-avatar">
              {p.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {p.username} {p.id === currentUserId ? '(You)' : ''}
              </span>
            </div>
            {p.id === hostId && (
              <span className="host-badge">HOST</span>
            )}
          </div>
        ))}
        {participants.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Waiting for participants...
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
