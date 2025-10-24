'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, User, Calendar } from 'lucide-react';
import { storage } from '@/lib/localStorage';

// FIX: useInterval hook - prevents stale closure bug (Dan Abramov pattern)
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

interface MessageThread {
  projectId: string;
  taskId: string;
  projectNumber: string;
  taskDescription: string;
  messages: any[];
  lastMessage: any;
  unreadCount: number;
}

export default function MessagesCenter({ onClose }: { onClose: () => void }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('📬 MessagesCenter: Initial load');
    loadThreads();

    const handleUpdate = () => {
      console.log('📬 MessagesCenter: projectsUpdated event received! Reloading threads...');
      loadThreads();
    };

    window.addEventListener('projectsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (selectedThread && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread?.messages]);

  // REAL-TIME POLLING: Fetch directly from cloud API every 2 seconds (like worker does)
  useInterval(() => {
    console.log('📬 Admin: Polling for messages from cloud...');
    loadThreads();
  }, 2000);

  const loadThreads = async () => {
    try {
      // FETCH FROM CLOUD (source of truth)
      console.log('📬 MessagesCenter: Fetching messages from cloud...');
      const response = await fetch('/api/sync/messages');
      const data = await response.json();

      if (!data.success || !data.messages) {
        console.error('📬 Failed to fetch messages from cloud:', data.error);
        // Fallback to localStorage
        loadThreadsFromLocalStorage();
        return;
      }

      console.log('📬 MessagesCenter: Found', data.messages.length, 'message threads from cloud');

      // Get projects for metadata
      const projects = storage.getProjects();

      const messageThreads: MessageThread[] = data.messages
        .map((cloudThread: any) => {
          // Find project and task for metadata
          const project = projects.find(p => p.id === cloudThread.projectId);
          const task = project?.tasks?.find((t: any) => t.id === cloudThread.taskId);

          if (!project || !task) {
            console.warn('📬 Project or task not found for thread:', cloudThread.projectId, cloudThread.taskId);
            return null;
          }

          const unreadCount = cloudThread.messages.filter((m: any) => !m.read && m.sender !== 'admin').length;
          const lastMessage = cloudThread.messages[cloudThread.messages.length - 1];

          return {
            projectId: cloudThread.projectId,
            taskId: cloudThread.taskId,
            projectNumber: project.number,
            taskDescription: task.description,
            messages: cloudThread.messages,
            lastMessage,
            unreadCount
          };
        })
        .filter((t: any) => t !== null); // Remove null entries

      // Sort by last message time
      messageThreads.sort((a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );

      console.log('📬 MessagesCenter: Setting', messageThreads.length, 'threads in state');
      setThreads(messageThreads);

      // Update selected thread if it exists
      setSelectedThread(prevThread => {
        if (!prevThread) return prevThread;

        const updated = messageThreads.find(t =>
          t.projectId === prevThread.projectId && t.taskId === prevThread.taskId
        );

        if (!updated) return prevThread;

        const oldCount = prevThread.messages?.length || 0;
        const newCount = updated.messages?.length || 0;

        if (newCount !== oldCount) {
          console.log('📬 Admin: NEW MESSAGES!', oldCount, '→', newCount);
        }

        return { ...updated };
      });
    } catch (error) {
      console.error('📬 Failed to load messages from cloud:', error);
      // Fallback to localStorage
      loadThreadsFromLocalStorage();
    }
  };

  // Fallback: Load from localStorage if cloud fetch fails
  const loadThreadsFromLocalStorage = () => {
    console.log('📬 MessagesCenter: Falling back to localStorage...');
    const allMessages = storage.getAllMessages();

    const messageThreads: MessageThread[] = allMessages.map(item => {
      const unreadCount = item.messages.filter(m => !m.read && m.sender !== 'admin').length;
      const lastMessage = item.messages[item.messages.length - 1];

      return {
        ...item,
        lastMessage,
        unreadCount
      };
    });

    messageThreads.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    setThreads(messageThreads);
  };

  const handleSelectThread = async (thread: MessageThread) => {
    setSelectedThread(thread);

    // Mark messages as read in cloud
    try {
      await fetch('/api/worker/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: thread.projectId,
          taskId: thread.taskId,
          workerId: 'admin',
        }),
      });
      console.log('✅ Messages marked as read in cloud');
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
    }

    // Also mark in localStorage for immediate feedback
    storage.markMessagesAsRead(thread.projectId, thread.taskId, 'admin');

    // Reload to update unread counts
    loadThreads();
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return;

    const textToSend = messageText;
    setMessageText('');

    // OPTIMISTIC UPDATE: Add message to UI immediately
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      sender: 'admin',
      text: textToSend,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setSelectedThread({
      ...selectedThread,
      messages: [...selectedThread.messages, optimisticMessage],
    });

    // Save to cloud (source of truth)
    try {
      console.log('📤 Admin sending message to cloud...');
      const response = await fetch('/api/worker/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedThread.projectId,
          taskId: selectedThread.taskId,
          text: textToSend,
          sender: 'admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin message saved to cloud');
        // Reload threads to get the confirmed version from cloud
        loadThreads();
      } else {
        console.error('❌ Message send failed:', data.error);
        // Revert optimistic update
        setSelectedThread({
          ...selectedThread,
          messages: selectedThread.messages.filter(m => m.id !== optimisticMessage.id),
        });
        setMessageText(textToSend);
        alert('Failed to send message: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Revert optimistic update
      setSelectedThread({
        ...selectedThread,
        messages: selectedThread.messages.filter(m => m.id !== optimisticMessage.id),
      });
      setMessageText(textToSend);
      alert('Error sending message. Check console.');
    }

    // Also save to localStorage for backup
    storage.sendMessage(selectedThread.projectId, selectedThread.taskId, textToSend, 'admin');
  };

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex">
        {/* Threads List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              <p className="text-xs text-gray-500">{totalUnread} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  console.log('🔄 ADMIN: Manual sync triggered from Messages panel');
                  const { syncDataToCloud } = await import('@/lib/syncToCloud');
                  await syncDataToCloud();
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
              >
                🔄 Sync
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {threads.map(thread => (
                  <div
                    key={`${thread.projectId}-${thread.taskId}`}
                    onClick={() => handleSelectThread(thread)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedThread?.taskId === thread.taskId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        #{thread.projectNumber}
                      </h3>
                      {thread.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1 mb-2">{thread.taskDescription}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {thread.lastMessage.sender}: {thread.lastMessage.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(thread.lastMessage.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">#{selectedThread.projectNumber}</h3>
                <p className="text-sm text-gray-600">{selectedThread.taskDescription}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThread.messages.map(message => {
                  const isAdmin = message.sender === 'admin';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-3 ${
                          isAdmin
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isAdmin ? 'text-blue-200' : 'text-gray-500'}`}>
                          {message.sender}
                        </div>
                        <div className="text-sm">{message.text}</div>
                        <div className={`text-xs mt-1 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
