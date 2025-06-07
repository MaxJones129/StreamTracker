'use client';

import { useState } from 'react';
import styles from '../styles/ChatWidget.module.css'; // <- You’ll create this CSS module

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! You can ask me to add a show like this:\n\n“I’m currently watching Breaking Bad.”\n\nI’ll take care of the rest!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ratgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();
      console.log('🎯 Response from RatGPT:', data);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'No reply received from API.',
        },
      ]);

      window.dispatchEvent(new Event('refresh-shows'));
    } catch (err) {
      console.error('RatGPT Error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error: Unable to get a response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatWidget}>
      {isOpen && (
        <div className={styles.chatBox}>
          <div className={styles.header}>
            <span>RatGPT</span>
            <button type="button" onClick={() => setIsOpen(false)}>
              ✖
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={idx} className={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
                <span>
                  <strong>{msg.role === 'user' ? 'You' : 'RatGPT'}:</strong> {msg.content}
                </span>
              </div>
            ))}
            {loading && <p className={styles.typing}>RatGPT is typing...</p>}
          </div>

          <div className={styles.inputArea}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask something..." />
            <button type="button" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button type="button" className={styles.floatingBtn} onClick={() => setIsOpen(true)}>
          🐀 Chat with RatGPT
        </button>
      )}
    </div>
  );
}
