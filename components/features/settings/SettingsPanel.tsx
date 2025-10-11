'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { playNotificationSound, initializeAudio } from '@/lib/notificationSounds';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [chatSoundEnabled, setChatSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatSoundEnabled') !== 'false';
    }
    return true;
  });

  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationSoundEnabled') !== 'false';
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('chatSoundEnabled', String(chatSoundEnabled));
  }, [chatSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', String(notificationSoundEnabled));
  }, [notificationSoundEnabled]);

  const playTestChatSound = () => {
    initializeAudio(); // Make sure audio is initialized
    playNotificationSound('chat');
  };

  const playTestNotificationSound = () => {
    initializeAudio(); // Make sure audio is initialized
    playNotificationSound('notification');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notifications Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Notifications</h3>

            {/* Chat Sound */}
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Chat Sounds</div>
                    <div className="text-sm text-gray-600">Play sound when messages arrive</div>
                  </div>
                  <button
                    onClick={() => setChatSoundEnabled(!chatSoundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      chatSoundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        chatSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <button
                onClick={playTestChatSound}
                className="w-full flex items-center justify-center gap-2 p-2 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium text-sm"
              >
                <Volume2 className="w-4 h-4" />
                Test Chat Sound
              </button>
            </div>

            {/* Notification Sound */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Notification Sounds</div>
                    <div className="text-sm text-gray-600">Play sound for task updates</div>
                  </div>
                  <button
                    onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSoundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <button
                onClick={playTestNotificationSound}
                className="w-full flex items-center justify-center gap-2 p-2 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-amber-700 font-medium text-sm"
              >
                <Volume2 className="w-4 h-4" />
                Test Notification Sound
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
