'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, MessageSquare, Play, XCircle, Check } from 'lucide-react';
import { storage, Notification } from '@/lib/localStorage';

interface NotificationsPanelProps {
  onClose: () => void;
  onNavigateToTask?: (projectId: string, taskId: string, tab: 'details' | 'messages' | 'activity') => void;
}

export default function NotificationsPanel({ onClose, onNavigateToTask }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('notificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate);
    };
  }, []);

  const loadNotifications = () => {
    setNotifications(storage.getNotifications());
  };

  const handleMarkAsRead = (id: string) => {
    storage.markNotificationAsRead(id);
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);

    // Navigate to task with appropriate tab
    if (onNavigateToTask) {
      const tab = notification.type === 'message_received' ? 'messages' : 'activity';
      onNavigateToTask(notification.projectId, notification.taskId, tab);
      onClose();
    }
  };

  const handleMarkAllAsRead = () => {
    storage.markAllNotificationsAsRead();
    loadNotifications();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_accepted': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'task_rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'task_completed': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'task_started': return <Play className="w-5 h-5 text-blue-600" />;
      case 'message_received': return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-amber-500 bg-amber-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                    notification.read ? 'bg-white' : getPriorityColor(notification.priority)
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
