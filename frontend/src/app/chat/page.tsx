'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export default function ChatPage() {
  const [messages, setMessages] = useState<{id:number;text:string}[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
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
  }, []);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.emit('chat message', input.trim());
      setInput('');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Chat</h1>
      <ul className="mb-4">
        {messages.map((m) => (
          <li key={m.id}>{m.text}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-grow"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
