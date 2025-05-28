'use client';

import React, { useState } from 'react';

export default function RatGPT() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch('/api/ratgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    setInput('');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-white">
      <h1 className="text-xl font-bold mb-2">RatGPT</h1>
      <div className="bg-gray-900 p-4 rounded h-96 overflow-y-scroll mb-2">
        {messages.map((msg, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <strong>{msg.role === 'user' ? 'You' : 'RatGPT'}:</strong> {msg.content}
          </p>
        ))}
      </div>
      <input className="w-full p-2 rounded text-black" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask me something..." />
      <button type="button" className="mt-2 w-full p-2 bg-blue-600 rounded" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}
