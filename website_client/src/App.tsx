// Hai
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { v4 as uuidv4 } from 'uuid';

// 1. Updated Type: Added 'hotels' to handle the structured data
type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  hotels?: { name: string; price: string; rating: string }[]; 
};

type Page = 'chat' | 'order-tracking' | 'refund' | 'complaint' | 'escalation';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{id: number, title: string}[]>([]);
  const [input, setInput] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const CurrentInput = input;
    setInput('');

    const sessionId = uuidv4();

    try {
      const response = await fetch('http://127.0.0.1:8000/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: CurrentInput }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setTimeout(() => {
        // 2. Logic to parse the nested list [['Name', 'Price', 'Rating'], ...]
        const parsedHotels = Array.isArray(data.reply) ? data.reply.map((hotelArr: string[]) => {
          return {
            // Extracts everything before price, removes leading numbers (e.g., "1. ")
            name: hotelArr.slice(0, hotelArr.length - 2).join(' ').replace(/^\d+\.\s/, ''),
            price: hotelArr[hotelArr.length - 2],
            rating: hotelArr[hotelArr.length - 1]
          };
        }) : null;

        const aiMsg: Message = { 
          id: Date.now() + 1, 
          text: parsedHotels ? "Here are the best options I found for you:" : data.reply, 
          sender: 'ai',
          hotels: parsedHotels || undefined 
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1000);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Rest of your functions (handleNewChat, RenderPage) remain the same...
  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages.find(m => m.sender === 'user')?.text.substring(0, 20) || "New Trip Plan";
      setHistory(prev => [{ id: Date.now(), title: `${title}...` }, ...prev]);
    }
    setMessages([]);
    setCurrentPage('chat');
  };

  const RenderPage = () => {
    const title = currentPage.replace('-', ' ').toUpperCase();
    return (
      <div className="sub-page">
        <button className="back-btn" onClick={() => setCurrentPage('chat')}>← Back to Chat</button>
        <h2 className='title-name'>{title}</h2>
        <p>Please provide your details below for the {title} process.</p>
        <div className="placeholder-form">
          <input type="text" placeholder="Reference Number" className="form-input" />
          <button className="action-btn">Submit Request</button>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar" onMouseEnter={() => setIsSidebarOpen(true)} onMouseLeave={() => setIsSidebarOpen(false)}>
        {/* Sidebar content... */}
        <div className="sidebar-section">
          <div className="nav-item" title="Profile">
            <div className="icon">👤</div>
            <span className="nav-label">Anson Thomas</span>
          </div>
          <div className="nav-item" title="New Chat" onClick={handleNewChat}>
            <div className="icon">＋</div>
            <span className="nav-label">New chat</span>
          </div>
          <div className="nav-item" title="Search Chat">
            <div className="icon">🔍</div>
            <span className="nav-label">Search chat</span>
          </div>
        </div>
        <div className="sidebar-section history-section">
          <div className="nav-item header-item" title="Recent Chats">
            <div className="icon">🕒</div>
            <span className="nav-label">Recent history</span>
          </div>
            {history.map(item => (
            <div key={item.id} className="nav-item history-item">
              <div className="icon">📄</div>
              <span className="nav-label">{item.title}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <div className="content-container">
          <header className="hero-header">
            <h1 className="main-greeting">Hello! I'm your Travel Assistant.</h1>
            <div className="quick-actions-grid">
              <button className="action-card" onClick={() => setCurrentPage('order-tracking')}><span className="card-icon">📦</span> Track Order</button>
              <button className="action-card" onClick={() => setCurrentPage('refund')}><span className="card-icon">💰</span> Refund</button>
              <button className="action-card" onClick={() => setCurrentPage('complaint')}><span className="card-icon">📝</span> Complaint</button>
              <button className="action-card" onClick={() => setCurrentPage('escalation')}><span className="card-icon">⚠️</span> Escalate</button>
            </div>
          </header>

          <section className="chat-display-area">
            {currentPage === 'chat' ? (
              <div className="chat-messages">
                {messages.length === 0 && <p className="empty-state">Start your conversation below!</p>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    <div className="bubble">
                      {msg.text}
                      
                      {/* 3. UI Component to render the structured data */}
                      {msg.hotels && (
                        <div className="hotel-list">
                          {msg.hotels.map((hotel, idx) => (
                            <div key={idx} className="hotel-card-item">
                              <div className="hotel-info">
                                <span className="hotel-name">{hotel.name}</span>
                                <span className="hotel-price">{hotel.price}</span>
                              </div>
                              <div className="hotel-rating">⭐ {hotel.rating}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <RenderPage />
            )}
          </section>

          <footer className="input-wrapper">
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about flights, hotels, or trip plans..."
              />
              <button className="send-btn" onClick={handleSend}>
                <svg className='send-btn-image' viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;