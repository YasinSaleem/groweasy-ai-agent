import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ICONS = {
  user: '👤',
  phone: '📞',
  'arrow-right': '→',
  circular: '💬',
};

const ProgressDots = ({ count, activeIndex }) => (
  <div className="progress-dots">
    {[...Array(count)].map((_, i) => (
      <span
        key={i}
        className={`dot${i === activeIndex ? ' active' : ''}`}
      />
    ))}
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat
  const startChat = async () => {
    if (!name || !phone) {
      alert('Please enter your name and phone number');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/chat/start', {
        name,
        phone,
        source: 'web'
      });

      setLeadId(response.data.leadId);
      setMessages([{ text: response.data.response, sender: 'agent' }]);
      setIsStarting(false);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await axios.post('http://localhost:3000/api/chat/continue', {
        leadId,
        message: input
      });

      setMessages(prev => [...prev, { text: response.data.response, sender: 'agent' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'agent'
      }]);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      isStarting ? startChat() : sendMessage();
    }
  };

  return (
    <div className="chat-outer-container">
      <div className="chat-container minimalist">
        <header className="chat-header">
          <div className="chat-header-icon">{ICONS.circular}</div>
          <h2 className="chat-title">Groweasy Real Estate Assistant</h2>
          <div className="chat-subtitle">Your AI-powered property guide</div>
        </header>

        <main className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {isStarting ? (
          <form className="chat-input-start" onSubmit={e => { e.preventDefault(); startChat(); }}>
            <div className="input-with-icon">
              <span className="input-icon">{ICONS.user}</span>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="minimal-input"
                required
              />
            </div>
            <div className="input-with-icon">
              <span className="input-icon">{ICONS.phone}</span>
              <input
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="minimal-input"
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Submit <span className="btn-icon">{ICONS['arrow-right']}</span>
            </button>
          </form>
        ) : (
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="minimal-input"
            />
            <button onClick={sendMessage} className="submit-btn">
              Send <span className="btn-icon">{ICONS['arrow-right']}</span>
            </button>
          </div>
        )}

        <footer className="chat-footer">
          <div className="security-note">Your information is secure</div>
          <ProgressDots count={3} activeIndex={isStarting ? 0 : 1} />
        </footer>
      </div>
    </div>
  );
};

export default Chat;