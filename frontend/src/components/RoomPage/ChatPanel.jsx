import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useRoomStore } from '../../stores/roomStore';
import { useChat } from '../../hooks/useChat';
import './ChatPanel.css';

const ChatPanel = () => {
  const [inputValue, setInputValue] = useState('');
  const messages = useChatStore(state => state.messages);
  const currentUserId = useRoomStore(state => state.userId);
  const { sendMessage } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto', fontSize: '0.9rem' }}>
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.userId === currentUserId;
            return (
              <div key={index} className={`chat-message ${isSelf ? 'self' : 'other'}`}>
                {!isSelf && <div className="sender">{msg.username}</div>}
                <div className="content">{msg.content}</div>
                <div className="timestamp">{formatTime(msg.timestamp)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;
