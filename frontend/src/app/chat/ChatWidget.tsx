'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!open) return;
    if (!socket) {
      socket = io('http://localhost:5000');
    }

    socket.on('chat history', (msgs: any) => setMessages(msgs));
    socket.on('chat message', (msg: any) =>
      setMessages((prev) => [...prev, msg])
    );

    return () => {
      if (socket) {
        socket.off('chat history');
        socket.off('chat message');
      }
    };
  }, [open]);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.emit('chat message', input.trim());
      setInput('');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
      >
        Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white border shadow-lg rounded-lg p-2 text-sm">
      <div className="flex justify-between mb-2">
        <span className="font-bold">Chat</span>
        <button onClick={() => setOpen(false)} className="text-gray-500">×</button>
      </div>
      <div className="h-48 overflow-y-auto mb-2">
        {messages.map((m) => (
          <div key={m.id}>{m.text}</div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className="border p-1 flex-grow"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-2" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
