import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { messagesAPI } from '../services/api';
import { FiSend, FiPaperclip, FiSmile, FiSearch, FiX } from 'react-icons/fi';
import './Messages.css';

const EMOJI_CATEGORIES = [
  { label: '😊 Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','😎','🥳','😏','😒','😞','😔'] },
  { label: '👋 Gestures', emojis: ['👍','👎','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👋','🤚','🖐','✋','🖖','💪','🦾','🙏','👏','🤝','🫶','❤️','🧡','💛','💚','💙'] },
  { label: '🍎 Food', emojis: ['🍎','🍊','🍋','🍇','🍓','🫐','🍒','🥑','🥦','🥕','🌽','🍆','🫑','🥗','🍱','🍜','🍣','🍔','🌮','🥙','🥪','🧆','🥚','🧀','🥞','🧇','🥓','🍗','🥩','🫕'] },
  { label: '💪 Fitness', emojis: ['💪','🏋️','🤸','🧘','🏃','🚴','🏊','⚽','🏀','🎾','🏈','⚾','🎱','🏓','🏸','🥊','🥋','🎿','🏆','🥇','🥈','🥉','🎯','🔥','⚡','✨','💥','🌟','🏅','🎖️'] },
  { label: '🥗 Nutrition', emojis: ['🥗','🥤','💊','🧴','🫀','🧠','🦷','🦴','👁️','🩺','⚕️','🩹','💉','🧬','🔬','📊','📈','✅','❌','⚠️','🌱','🌿','🍃','🌾','🫘','🥜','🌰','🍄','🧄','🧅'] },
];

export default function Messages() {
  const { user } = useAuth();

  const [conversations, setConversations]     = useState([]);
  const [activeConv, setActiveConv]           = useState(null);
  const [msgs, setMsgs]                       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [msgsLoading, setMsgsLoading]         = useState(false);
  const [message, setMessage]                 = useState('');
  const [search, setSearch]                   = useState('');
  const [showEmojis, setShowEmojis]           = useState(false);
  const [emojiCategory, setEmojiCategory]     = useState(0);
  const [attachment, setAttachment]           = useState(null);

  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef     = useRef(null);
  const inputRef     = useRef(null);

  // ── Load conversations on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const { conversations } = await messagesAPI.getConversations();
        setConversations(conversations);
        if (conversations.length > 0) selectConv(conversations[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // ── Close emoji picker on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojis(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectConv = async (conv) => {
    setActiveConv(conv);
    setMsgsLoading(true);
    try {
      const { messages } = await messagesAPI.getMessages(conv._id);
      setMsgs(messages);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = attachment
      ? `📎 ${attachment.name}${message.trim() ? ` — ${message.trim()}` : ''}`
      : message.trim();
    if (!text || !activeConv) return;

    try {
      const { message: sent } = await messagesAPI.sendMessage(activeConv._id, text, attachment ? 'file' : 'text');
      setMsgs(prev => [...prev, sent]);
      // Update conversation preview
      setConversations(prev => prev.map(c =>
        c._id === activeConv._id ? { ...c, lastMessage: text, lastMessageAt: new Date() } : c
      ));
      setMessage('');
      setAttachment(null);
      setShowEmojis(false);
    } catch (err) {
      console.error(err);
    }
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    if (!input) { setMessage(prev => prev + emoji); return; }
    const start = input.selectionStart, end = input.selectionEnd;
    setMessage(message.slice(0, start) + emoji + message.slice(end));
    setTimeout(() => { input.selectionStart = input.selectionEnd = start + emoji.length; input.focus(); }, 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
    e.target.value = '';
  };

  // Get the other participant's info from a conversation
  const getOtherParticipant = (conv) => {
    if (!conv?.participants) return { name: 'Unknown', _id: '' };
    return conv.participants.find(p => p._id !== user?._id) || conv.participants[0];
  };

  const filteredConvs = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other.name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(search.toLowerCase());
  });

  const canSend = message.trim() || attachment;

  if (loading) return <div style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Loading messages...</div>;

  return (
    <div className="messages-page">
      <div className="msg-layout">

        {/* Conversation list */}
        <div className="msg-list">
          <div className="msg-list-header">
            <h3>Messages</h3>
            <div className="msg-search">
              <FiSearch />
              <input type="text" placeholder="Search conversations..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="msg-conversations">
            {filteredConvs.length === 0 && (
              <p className="msg-no-results">
                {conversations.length === 0 ? 'No conversations yet.' : `No results for "${search}"`}
              </p>
            )}
            {filteredConvs.map(conv => {
              const other = getOtherParticipant(conv);
              return (
                <div key={conv._id}
                  className={`msg-conv-item ${activeConv?._id === conv._id ? 'active' : ''}`}
                  onClick={() => selectConv(conv)}>
                  <div className="avatar" style={{ background: getAvatarColor(other._id) }}>
                    {getInitials(other.name)}
                  </div>
                  <div className="msg-conv-info">
                    <div className="msg-conv-top">
                      <strong>{other.name}</strong>
                      <span className="msg-conv-time">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="msg-conv-preview">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        {activeConv ? (
          <div className="msg-chat" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="msg-chat-header">
              {(() => {
                const other = getOtherParticipant(activeConv);
                return (
                  <>
                    <div className="avatar" style={{ background: getAvatarColor(other._id) }}>
                      {getInitials(other.name)}
                    </div>
                    <div>
                      <strong>{other.name}</strong>
                      <span className="msg-online-status">
                        {other.role === 'nutritionist' ? '● Nutritionist' : '○ Member'}
                      </span>
                    </div>
                    {other.role === 'nutritionist' && (
                      <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>Nutritionist</span>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="msg-chat-body">
              {msgsLoading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>Loading...</p>}
              {msgs.map(m => (
                <div key={m._id} className={`msg-bubble-row ${m.senderId === user?._id ? 'sent' : 'received'}`}>
                  {m.senderId !== user?._id && (
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.senderId) }}>
                      {getInitials(getOtherParticipant(activeConv).name)}
                    </div>
                  )}
                  <div className={`msg-bubble ${m.type === 'file' ? 'msg-bubble-file' : ''}`}>
                    <p>{m.text}</p>
                    <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Attachment preview */}
            {attachment && (
              <div className="msg-attachment-preview">
                <span>📎 {attachment.name}</span>
                <span className="msg-attachment-size">{attachment.size}</span>
                <button className="msg-attachment-remove" onClick={() => setAttachment(null)}><FiX /></button>
              </div>
            )}

            {/* Emoji picker */}
            {showEmojis && (
              <div className="emoji-picker" ref={emojiRef}>
                <div className="emoji-categories">
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <button key={i} className={`emoji-cat-btn ${emojiCategory === i ? 'active' : ''}`}
                      onClick={() => setEmojiCategory(i)} title={cat.label}>{cat.emojis[0]}</button>
                  ))}
                </div>
                <div className="emoji-cat-label">{EMOJI_CATEGORIES[emojiCategory].label}</div>
                <div className="emoji-grid">
                  {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
                    <button key={i} className="emoji-btn" onClick={() => insertEmoji(emoji)}>{emoji}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form className="msg-chat-input" onSubmit={handleSend}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <button type="button" className="msg-input-btn" onClick={() => fileInputRef.current?.click()}><FiPaperclip /></button>
              <input ref={inputRef} type="text" placeholder="Type a message..."
                value={message} onChange={e => setMessage(e.target.value)} />
              <button type="button" className={`msg-input-btn ${showEmojis ? 'active' : ''}`}
                onClick={() => setShowEmojis(prev => !prev)}><FiSmile /></button>
              <button type="submit" className="btn btn-primary btn-icon" disabled={!canSend}><FiSend /></button>
            </form>
          </div>
        ) : (
          <div className="msg-chat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
