'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
}

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<User[]>([]);

  const search = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <div className="flex gap-2">
        <input
          className="border p-2 flex-grow"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
        />
        <button
          className="bg-blue-500 text-white px-4"
          onClick={search}
          disabled={loading}
        >
          Search
        </button>
      </div>
      <ul className="mt-2">
        {results.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
