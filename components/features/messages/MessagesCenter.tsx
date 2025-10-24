'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, User, Calendar } from 'lucide-react';
import { storage } from '@/lib/localStorage';

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

  const loadThreads = () => {
    console.log('📬 MessagesCenter: Loading threads from localStorage...');
    const allMessages = storage.getAllMessages();
    console.log('📬 MessagesCenter: Found', allMessages.length, 'message threads');

    allMessages.forEach((item, idx) => {
      console.log(`  Thread ${idx + 1}:`, {
        projectId: item.projectId,
        taskId: item.taskId,
        projectNumber: item.projectNumber,
        messageCount: item.messages?.length || 0,
        lastMessage: item.messages?.[item.messages.length - 1]
      });
    });

    const messageThreads: MessageThread[] = allMessages.map(item => {
      const unreadCount = item.messages.filter(m => !m.read && m.sender !== 'admin').length;
      const lastMessage = item.messages[item.messages.length - 1];

      return {
        ...item,
        lastMessage,
        unreadCount
      };
    });

    // Sort by last message time
    messageThreads.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    console.log('📬 MessagesCenter: Setting', messageThreads.length, 'threads in state');
    setThreads(messageThreads);

    // Update selected thread if it exists
    if (selectedThread) {
      const updated = messageThreads.find(t =>
        t.projectId === selectedThread.projectId && t.taskId === selectedThread.taskId
      );
      if (updated) {
        console.log('📬 MessagesCenter: Updating selected thread with new messages');
        setSelectedThread(updated);
      }
    }
  };

  const handleSelectThread = (thread: MessageThread) => {
    setSelectedThread(thread);
    // Mark messages as read
    storage.markMessagesAsRead(thread.projectId, thread.taskId, 'admin');
    loadThreads();
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return;

    const textToSend = messageText;
    setMessageText('');

    // Save to localStorage for immediate UI update
    storage.sendMessage(selectedThread.projectId, selectedThread.taskId, textToSend, 'admin');
    loadThreads();

    // ALSO save to cloud so worker can see it
    try {
      console.log('📤 Admin sending message to cloud...');
      await fetch('/api/worker/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedThread.projectId,
          taskId: selectedThread.taskId,
          text: textToSend,
          sender: 'admin',
        }),
      });
      console.log('✅ Admin message saved to cloud');
    } catch (error) {
      console.error('❌ Failed to save admin message to cloud:', error);
    }
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
