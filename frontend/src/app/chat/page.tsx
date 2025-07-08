'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { chatApi, type Conversation, type ChatMessage, type ChatUser } from '@/utils/api';
import { getAuthToken } from '@/utils/auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

interface OnlineUser {
  userId: string;
  userName: string;
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}

function ChatPageContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);

  // Keep the ref in sync with the state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    loadConversations();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Clear typing indicators after 3 seconds of no activity
    if (typingUsers.length > 0) {
      const timeout = setTimeout(() => {
        const now = new Date();
        setTypingUsers(prev => prev.filter(user => 
          now.getTime() - user.timestamp.getTime() < 3000
        ));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [typingUsers]);

  const initializeSocket = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token }
      });

      socket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        socket?.emit('joinConversations');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      socket.on('conversationsJoined', (data) => {
        console.log(`Joined ${data.count} conversations`);
      });

      socket.on('newMessage', (message: ChatMessage) => {
        console.log('New message received:', message);
        console.log('Current active conversation:', activeConversationRef.current?._id);
        
        // Update conversation list with new message (but don't reload unread counts)
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
        
        // Update messages and unread counts
        if (activeConversationRef.current && message.conversationId === activeConversationRef.current._id) {
          console.log('Message is for active conversation, adding to messages');
          // If message is for active conversation, add to messages and auto-mark as read
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg._id === message._id);
            if (messageExists) {
              console.log('Message already exists, skipping');
              return prev;
            }
            console.log('Adding new message to active conversation');
            return [...prev, message];
          });
          
          // Auto-mark as read for active conversation
          markAsRead(message.conversationId);
        } else {
          console.log('Message is for different conversation, incrementing unread count');
          // If message is for another conversation, increment unread count
          setUnreadCounts(prev => ({
            ...prev,
            [message.conversationId]: (prev[message.conversationId] || 0) + 1
          }));
        }
      });

      socket.on('messageDelivered', (data) => {
        console.log('Message delivered:', data);
      });

      socket.on('messagesRead', (data) => {
        console.log('Messages read:', data);
        // Update read status for messages
        setMessages(prev => prev.map(msg => {
          if (data.messageIds.includes(msg._id)) {
            return {
              ...msg,
              readBy: [...msg.readBy, { userId: data.userId, readAt: data.readAt }]
            };
          }
          return msg;
        }));
      });

      socket.on('messageRead', (data) => {
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            return {
              ...msg,
              readBy: [...msg.readBy, { userId: data.userId, readAt: data.readAt }]
            };
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

      socket.on('userOnline', (data) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          return exists ? prev : [...prev, data];
        });
      });

      socket.on('userOffline', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message);
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
      setConversations(data);
      
      // Load unread counts for each conversation
      const counts: {[key: string]: number} = {};
      for (const conv of data) {
        try {
          // If this is the active conversation, the count should be 0 (auto-read)
          if (activeConversation && conv._id === activeConversation._id) {
            counts[conv._id] = 0;
          } else {
            const unreadData = await chatApi.getUnreadCount(conv._id);
            counts[conv._id] = unreadData.unreadCount;
          }
        } catch (err) {
          console.error('Failed to load unread count for conversation:', conv._id);
          // Default to 0 if there's an error, unless it's the active conversation
          counts[conv._id] = 0;
        }
      }
      setUnreadCounts(counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
      // Join the conversation room
      socket?.emit('joinConversation', conversationId);
      // Mark as read
      await markAsRead(conversationId);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const result = await chatApi.markAsRead(conversationId);
      // Update unread count
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
      return result;
    } catch (err: any) {
      console.error('Failed to mark as read:', err.message);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    // Leave previous conversation
    if (activeConversation) {
      socket?.emit('leaveConversation', activeConversation._id);
    }
    
    setActiveConversation(conversation);
    // Immediately set unread count to 0 for the selected conversation
    setUnreadCounts(prev => ({ ...prev, [conversation._id]: 0 }));
    loadMessages(conversation._id);
    setShowUserSearch(false);
    setTypingUsers([]);
  };

  const sendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      console.log('Sending message:', {
        conversationId: activeConversation._id,
        text: newMessage.trim()
      });
      console.log('Socket connected:', socket?.connected);
      
      // Send via Socket.IO for real-time delivery
      socket?.emit('sendMessage', {
        conversationId: activeConversation._id,
        text: newMessage.trim()
      });
      
      setNewMessage('');
      stopTyping();
      // No need to reload conversations here as the newMessage socket event will handle updates
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && activeConversation) {
      setIsTyping(true);
      socket?.emit('typing', {
        conversationId: activeConversation._id,
        isTyping: true
      });
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping && activeConversation) {
      setIsTyping(false);
      socket?.emit('typing', {
        conversationId: activeConversation._id,
        isTyping: false
      });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
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
      setError(err.message || 'Failed to search users');
    }
  };

  const startConversation = async (user: ChatUser) => {
    try {
      const conversation = await chatApi.startConversation(user._id);
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        return exists ? prev : [conversation, ...prev];
      });
      selectConversation(conversation);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  const isMessageRead = (message: ChatMessage) => {
    const currentUserId = getCurrentUser();
    const otherParticipants = activeConversation?.participants.filter(p => p._id !== currentUserId) || [];
    
    return otherParticipants.every(participant =>
      message.readBy.some(readBy => readBy.userId === participant._id)
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="flex h-full">
            {/* Sidebar - Conversations List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-2">Chat</h1>
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
                  </div>
                  <button
                    onClick={() => setShowUserSearch(!showUserSearch)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>

                {/* User Search */}
                {showUserSearch && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={searchUsers}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Search
                      </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 max-h-32 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => startConversation(user)}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                          >
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No conversations yet. Start by searching for users above.
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = getOtherParticipant(conversation);
                    const unreadCount = unreadCounts[conversation._id] || 0;
                    const isOnline = onlineUsers.some(u => u.userId === otherUser?._id);
                    return (
                      <div
                        key={conversation._id}
                        onClick={() => selectConversation(conversation)}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          activeConversation?._id === conversation._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {otherUser?.name.charAt(0).toUpperCase() || '?'}
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {otherUser?.name || 'Unknown User'}
                              </div>
                              {unreadCount > 0 && (
                                <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                  {unreadCount}
                                </div>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {conversation.lastMessage.text}
                              </div>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium mr-3">
                          {getOtherParticipant(activeConversation)?.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        {onlineUsers.some(u => u.userId === getOtherParticipant(activeConversation)?._id) && (
                          <div className="absolute -bottom-0 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {getOtherParticipant(activeConversation)?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {onlineUsers.some(u => u.userId === getOtherParticipant(activeConversation)?._id) ? 'Online' : getOtherParticipant(activeConversation)?.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId._id === getCurrentUser();
                      const isRead = isMessageRead(message);
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <div className="text-sm">{message.text}</div>
                            <div className={`flex items-center justify-between text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              <span>{formatTime(message.createdAt)}</span>
                              {isOwnMessage && (
                                <span className="ml-2">
                                  {isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-2xl">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{typingUsers[0].userName} is typing</span>
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        onBlur={stopTyping}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={1}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !isConnected}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the sidebar or start a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
