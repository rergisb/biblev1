import React, { useState } from 'react';
import { X, User, Settings, Mic, Volume2, Palette } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  name: string;
  avatar: string;
  voiceSpeed: number;
  autoPlay: boolean;
  theme: 'dark' | 'blue' | 'purple';
  hapticFeedback: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useLocalStorage<UserSettings>('user-settings', {
    name: 'User',
    avatar: '👤',
    voiceSpeed: 1.0,
    autoPlay: true,
    theme: 'purple',
    hapticFeedback: true
  });

  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    setSettings(tempSettings);
    onClose();
  };

  const avatarOptions = ['👤', '🧑‍💻', '👨‍🚀', '👩‍🚀', '🤖', '👨‍🔬', '👩‍🔬', '🧙‍♂️', '🧙‍♀️'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User Profile</h2>
              <p className="text-sm text-gray-400">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={tempSettings.name}
                onChange={(e) => setTempSettings(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setTempSettings(prev => ({ ...prev, avatar }))}
                    className={`p-3 rounded-xl text-2xl transition-all duration-200 ${
                      tempSettings.avatar === avatar
                        ? 'bg-purple-500/30 border-2 border-purple-500'
                        : 'bg-white/10 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Voice Settings
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voice Speed: {tempSettings.voiceSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={tempSettings.voiceSpeed}
                onChange={(e) => setTempSettings(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Auto-play responses</span>
              <button
                onClick={() => setTempSettings(prev => ({ ...prev, autoPlay: !prev.autoPlay }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  tempSettings.autoPlay ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  tempSettings.autoPlay ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Accessibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Accessibility
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Haptic feedback</span>
              <button
                onClick={() => setTempSettings(prev => ({ ...prev, hapticFeedback: !prev.hapticFeedback }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  tempSettings.hapticFeedback ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  tempSettings.hapticFeedback ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};