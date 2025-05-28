'use client';

import { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
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
      console.log('OpenAI response:', data);

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

        // ✅ Trigger global event to refresh show list on homepage
        window.dispatchEvent(new Event('refresh-shows'));
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'No reply received from API.' }]);
      }
    } catch (err) {
      console.error('Error talking to RatGPT:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Unable to get a response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-gray-900 border border-white rounded-lg w-80 h-96 flex flex-col p-2 shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-white font-bold text-lg">RatGPT</h2>
            <button type="button" onClick={() => setIsOpen(false)} className="text-black">
              ✖
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-black p-2 rounded text-white text-sm mb-2">
            {messages.map((msg, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={idx} className={`mb-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <strong>{msg.role === 'user' ? 'You' : 'RatGPT'}:</strong> {msg.content}
              </div>
            ))}
            {loading && <p className="text-gray-400">RatGPT is typing...</p>}
          </div>

          <div className="flex gap-2">
            <input className="flex-1 p-1 text-black rounded" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask something..." />
            <button type="button" className="bg-blue-600 px-2 text-black rounded" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)} className="bg-blue-600 text-black px-4 py-2 rounded-full shadow-lg">
          💬 Ask RatGPT
        </button>
      )}
    </div>
  );
}
