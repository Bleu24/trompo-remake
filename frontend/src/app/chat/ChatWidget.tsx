'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '@/utils/auth';
import { chatApi, type Conversation, type ChatMessage, type ChatUser } from '@/utils/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    // Always initialize socket, regardless of widget open state
    initializeSocket();
    
    if (open) {
      loadConversations();
    }

    // Don't disconnect socket when component unmounts or widget closes
    // The socket should stay connected for real-time message delivery
    return () => {
      // Only disconnect on page refresh/navigation, not widget close
    };
  }, [open]);

  useEffect(() => {
    // Initialize socket immediately when component mounts, even if widget is closed
    initializeSocket();
    
    return () => {
      // Keep socket connected for background message delivery
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const token = getAuthToken()?.token;
    if (!token) return;

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token }
      });

      socket.on('connect', () => {
        setIsConnected(true);
        socket?.emit('joinConversations');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('newMessage', (message: ChatMessage) => {
        setConversations(prev => {
          return prev.map(conv => {
            if (conv._id === message.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  _id: message._id,
                  text: message.text,
                  createdAt: message.createdAt,
                  senderId: message.senderId
                },
                lastActivity: message.createdAt
              };
            }
            return conv;
          });
        });
        
        if (activeConversationRef.current && message.conversationId === activeConversationRef.current._id) {
          setMessages(prev => {
            const messageExists = prev.some(msg => msg._id === message._id);
            if (messageExists) return prev;
            return [...prev, message];
          });
          markAsRead(message.conversationId);
        } else {
          setUnreadCounts(prev => {
            const newCounts = {
              ...prev,
              [message.conversationId]: (prev[message.conversationId] || 0) + 1
            };
            // Update total unread count
            const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
            setTotalUnreadMessages(total);
            return newCounts;
          });
        }
      });

      socket.on('messageRead', (data) => {
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            return { ...msg, readBy: data.readBy, readAt: data.readAt };
          }
          return msg;
        }));
      });

      socket.on('userTyping', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId);
            return [...filtered, { 
              userId: data.userId, 
              userName: data.userName, 
              timestamp: new Date(data.timestamp) 
            }];
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data.slice(0, 5)); // Limit to 5 conversations for widget
      
      const counts: {[key: string]: number} = {};
      let totalUnread = 0;
      for (const conv of data.slice(0, 5)) {
        try {
          if (activeConversation && conv._id === activeConversation._id) {
            counts[conv._id] = 0;
          } else {
            const unreadData = await chatApi.getUnreadCount(conv._id);
            counts[conv._id] = unreadData.unreadCount;
            totalUnread += unreadData.unreadCount;
          }
        } catch (err) {
          counts[conv._id] = 0;
        }
      }
      setUnreadCounts(counts);
      setTotalUnreadMessages(totalUnread);
    } catch (err: any) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
      socket?.emit('joinConversation', conversationId);
      await markAsRead(conversationId);
    } catch (err: any) {
      setError('Failed to load messages');
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await chatApi.markAsRead(conversationId);
      setUnreadCounts(prev => {
        const newCounts = { ...prev, [conversationId]: 0 };
        // Update total unread count
        const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        setTotalUnreadMessages(total);
        return newCounts;
      });
      
      // Emit read receipt
      socket?.emit('markMessageRead', { conversationId });
    } catch (err: any) {
      console.error('Failed to mark as read:', err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (activeConversation && socket) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Emit typing indicator
      socket.emit('typing', {
        conversationId: activeConversation._id,
        isTyping: value.length > 0
      });
      
      // Set timeout to stop typing indicator
      if (value.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          if (socket) {
            socket.emit('typing', {
              conversationId: activeConversation._id,
              isTyping: false
            });
          }
        }, 1000);
      }
    }
  };

  const selectConversation = (conversation: Conversation) => {
    if (activeConversation) {
      socket?.emit('leaveConversation', activeConversation._id);
    }
    
    setActiveConversation(conversation);
    setUnreadCounts(prev => ({ ...prev, [conversation._id]: 0 }));
    loadMessages(conversation._id);
    setShowUserSearch(false);
  };

  const sendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      socket?.emit('sendMessage', {
        conversationId: activeConversation._id,
        text: newMessage.trim()
      });
      
      setNewMessage('');
    } catch (err: any) {
      setError('Failed to send message');
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await chatApi.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err: any) {
      setError('Failed to search users');
    }
  };

  const startConversation = async (user: ChatUser) => {
    try {
      const conversation = await chatApi.startConversation(user._id);
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        return exists ? prev : [conversation, ...prev].slice(0, 5);
      });
      selectConversation(conversation);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      setError('Failed to start conversation');
    }
  };

  const getCurrentUser = () => {
    const token = getAuthToken();
    return token?.userId;
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const currentUserId = getCurrentUser();
    return conversation.participants.find(p => p._id !== currentUserId);
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors duration-200 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.343-.306c-.584.296-1.925.464-3.192.42-.477-.014-.692-.057-.692-.518 0-.277.095-.446.23-.595C6.112 18.747 5 16.729 5 14.5A8.5 8.5 0 0113.5 6c4.418 0 8 3.582 8 6z" />
        </svg>
        {getTotalUnreadCount() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {getTotalUnreadCount()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900 dark:text-white">Chat</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button 
            onClick={() => setOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!activeConversation ? (
          <div className="h-full flex flex-col">
            {/* User Search */}
            {showUserSearch && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-20 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => startConversation(user)}
                        className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm"
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 dark:text-white">{user.name}</span>
                        <span className="text-xs text-gray-500">({user.role})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  const unreadCount = unreadCounts[conversation._id] || 0;
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => selectConversation(conversation)}
                      className="p-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {otherUser?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {otherUser?.name || 'Unknown'}
                          </span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {conversation.lastMessage.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {getOtherParticipant(activeConversation)?.name || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {messages.map((message) => {
                const isOwn = message.senderId._id === getCurrentUser();
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${isOwn ? 'text-right' : 'text-left'}`}>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        {message.text}
                      </div>
                      {isOwn && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.readBy && message.readBy.length > 0 ? (
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10.293 14.707a1 1 0 001.414 0l8-8a1 1 0 10-1.414-1.414L11 12.586 7.707 9.293a1 1 0 00-1.414 1.414l4 4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                      {!isOwn && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {typingUsers[0].userName} is typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                />
                <button 
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-2 py-1 rounded text-sm transition-colors duration-200" 
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-2 py-1 text-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
