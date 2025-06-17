import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
    <div className="chat-container">
      <div className="chat-header">
        <h2>GrowEasy Real Estate Assistant</h2>
      </div>

      <div className="chat-messages">
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
      </div>

      {isStarting ? (
        <div className="chat-input-start">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={startChat}>Start Chat</button>
        </div>
      ) : (
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default Chat;