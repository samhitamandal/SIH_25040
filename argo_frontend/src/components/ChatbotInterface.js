import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Import the ReactMarkdown component
import remarkGfm from 'remark-gfm'; // Import the GFM plugin
import './ChatbotInterface.css';

// Define the correct URL for your FastAPI backend
const API_URL = "http://localhost:8080"; // Corrected port to 8000

function ChatbotInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    const initialMessage = { text: "Hello! I am FloatChat. What can I help you find about ARGO ocean data?", sender: 'ai' };
    setMessages([initialMessage]);
  }, []);

  // Auto-scroll to the bottom of the chat history
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/query`, { // Corrected endpoint to /query
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          k: 6
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = { text: data.final_answer, sender: 'ai' };
      
      setIsTyping(false);
      setMessages((prevMessages) => [...prevMessages, aiResponse]);

    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      const errorMessage = { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {/* Use ReactMarkdown to render the message text */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.text}
            </ReactMarkdown>
          </div>
        ))}
        {isTyping && <div className="message ai typing-indicator">...</div>}
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about ARGO data..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatbotInterface;