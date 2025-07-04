'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Conversation {
  id: string;
  title: string;
}

export default function ChatHistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    fetch('/api/chat/conversations')
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Chat History</h1>
      <ul className="space-y-2">
        {conversations.map((c) => (
          <li key={c.id}>
            <Link href={`/chat/${c.id}`} className="text-blue-600 underline">
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
