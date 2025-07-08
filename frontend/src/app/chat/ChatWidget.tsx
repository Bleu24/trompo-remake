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
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors duration-200"
      >
        Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-2 text-sm">
      <div className="flex justify-between mb-2">
        <span className="font-bold text-gray-900 dark:text-gray-100">Chat</span>
        <button onClick={() => setOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">×</button>
      </div>
      <div className="h-48 overflow-y-auto mb-2 bg-gray-50 dark:bg-gray-900 rounded p-2">
        {messages.map((m) => (
          <div key={m.id} className="text-gray-800 dark:text-gray-200 mb-1">{m.text}</div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 flex-grow rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-2 rounded transition-colors duration-200" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
