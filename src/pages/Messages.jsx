import { useState } from 'react';
import { conversations } from '../data/messages';
import { getInitials, getAvatarColor } from '../data/users';
import { FiSend, FiPaperclip, FiSmile, FiSearch } from 'react-icons/fi';
import './Messages.css';

export default function Messages() {
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [message, setMessage] = useState('');
  const [msgs, setMsgs] = useState(activeConv.messages);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMsgs(prev => [...prev, {
      id: `m${Date.now()}`, senderId: 'u1', text: message, time: 'Just now', type: 'text'
    }]);
    setMessage('');
  };

  const selectConv = (conv) => {
    setActiveConv(conv);
    setMsgs(conv.messages);
  };

  return (
    <div className="messages-page">
      <div className="msg-layout">
        {/* Conversation List */}
        <div className="msg-list">
          <div className="msg-list-header">
            <h3>Messages</h3>
            <div className="msg-search">
              <FiSearch />
              <input type="text" placeholder="Search conversations..." />
            </div>
          </div>
          <div className="msg-conversations">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`msg-conv-item ${activeConv.id === conv.id ? 'active' : ''}`}
                onClick={() => selectConv(conv)}
              >
                <div className={`avatar ${conv.online ? 'avatar-online' : ''}`}
                  style={{ background: getAvatarColor(conv.participantId) }}>
                  {getInitials(conv.participantName)}
                </div>
                <div className="msg-conv-info">
                  <div className="msg-conv-top">
                    <strong>{conv.participantName}</strong>
                    <span className="msg-conv-time">{conv.lastMessageTime}</span>
                  </div>
                  <p className="msg-conv-preview">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && <span className="msg-unread-badge">{conv.unread}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="msg-chat">
          <div className="msg-chat-header">
            <div className={`avatar ${activeConv.online ? 'avatar-online' : ''}`}
              style={{ background: getAvatarColor(activeConv.participantId) }}>
              {getInitials(activeConv.participantName)}
            </div>
            <div>
              <strong>{activeConv.participantName}</strong>
              <span className="msg-online-status">
                {activeConv.online ? '● Online' : '○ Offline'}
              </span>
            </div>
            {activeConv.participantRole === 'nutritionist' && (
              <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>Nutritionist</span>
            )}
          </div>

          <div className="msg-chat-body">
            {msgs.map(m => (
              <div key={m.id} className={`msg-bubble-row ${m.senderId === 'u1' ? 'sent' : 'received'}`}>
                {m.senderId !== 'u1' && (
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(activeConv.participantId) }}>
                    {getInitials(activeConv.participantName)}
                  </div>
                )}
                <div className="msg-bubble">
                  <p>{m.text}</p>
                  <span className="msg-time">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          <form className="msg-chat-input" onSubmit={handleSend}>
            <button type="button" className="msg-input-btn"><FiPaperclip /></button>
            <input
              type="text" placeholder="Type a message..."
              value={message} onChange={e => setMessage(e.target.value)}
            />
            <button type="button" className="msg-input-btn"><FiSmile /></button>
            <button type="submit" className="btn btn-primary btn-icon" disabled={!message.trim()}>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
