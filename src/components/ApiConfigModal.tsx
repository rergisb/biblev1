import React, { useState, useEffect } from 'react';
import { X, Settings, Key, TestTube, CheckCircle, AlertCircle, Volume2, Play, Square } from 'lucide-react';
import { testApiConnection, synthesizeSpeech, playAudioBuffer } from '../services/elevenLabsService';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiConfig {
  apiKey: string;
  voiceId: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useLocalStorage<ApiConfig>('elevenlabs-config', {
    apiKey: '',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    voiceSettings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  });

  const [tempConfig, setTempConfig] = useState(config);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempConfig(config);
      setConnectionStatus('idle');
    }
  }, [isOpen, config]);

  const handleTestConnection = async () => {
    if (!tempConfig.apiKey.trim()) {
      setConnectionStatus('error');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const isConnected = await testApiConnection(tempConfig.apiKey);
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestVoice = async () => {
    if (!tempConfig.apiKey.trim()) {
      alert('Please enter your API key first');
      return;
    }

    setIsTestingVoice(true);
    setIsPlayingTest(true);

    try {
      const testText = "Hello! This is a test of your Bible companion voice. May God's peace be with you today.";
      
      console.log('Testing voice with:', {
        voiceId: tempConfig.voiceId,
        settings: tempConfig.voiceSettings,
        apiKey: tempConfig.apiKey.substring(0, 10) + '...'
      });
      
      const audioBuffer = await synthesizeSpeech(
        testText,
        tempConfig.voiceId,
        tempConfig.voiceSettings,
        tempConfig.apiKey
      );
      
      await playAudioBuffer(audioBuffer);
      
    } catch (error) {
      console.error('Voice test failed:', error);
      alert(`Voice test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingVoice(false);
      setIsPlayingTest(false);
    }
  };

  const handleSave = () => {
    setConfig(tempConfig);
    onClose();
  };

  const voiceOptions = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Warm & Friendly' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi - Confident & Strong' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Soft & Gentle' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Deep & Resonant' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold - Authoritative' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Clear & Professional' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ElevenLabs Configuration</h2>
              <p className="text-sm text-gray-400">Configure your voice synthesis settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">API Configuration</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ElevenLabs API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={tempConfig.apiKey}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full p-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="sk_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a 
                    href="https://elevenlabs.io/app/speech-synthesis" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    ElevenLabs Dashboard
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !tempConfig.apiKey.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TestTube className="w-4 h-4" />
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                
                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Connection successful!</span>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Voice Selection</h3>
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice || !tempConfig.apiKey.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPlayingTest 
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                    : 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                }`}
              >
                {isPlayingTest ? (
                  <>
                    <Square className="w-4 h-4" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    {isTestingVoice ? 'Loading...' : 'Test Voice'}
                  </>
                )}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose Voice
              </label>
              <select
                value={tempConfig.voiceId}
                onChange={(e) => setTempConfig(prev => ({ ...prev, voiceId: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {voiceOptions.map((voice) => (
                  <option key={voice.id} value={voice.id} className="bg-gray-800">
                    {voice.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a voice and click "Test Voice" to hear how it sounds with your current settings
              </p>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Voice Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stability: {tempConfig.voiceSettings.stability.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tempConfig.voiceSettings.stability}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, stability: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values make voice more consistent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Similarity: {tempConfig.voiceSettings.similarity_boost.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tempConfig.voiceSettings.similarity_boost}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, similarity_boost: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values make voice more similar to original</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style: {tempConfig.voiceSettings.style.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tempConfig.voiceSettings.style}
                  onChange={(e) => setTempConfig(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, style: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values add more expressiveness</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Speaker Boost</span>
                <button
                  onClick={() => setTempConfig(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, use_speaker_boost: !prev.voiceSettings.use_speaker_boost }
                  }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    tempConfig.voiceSettings.use_speaker_boost ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    tempConfig.voiceSettings.use_speaker_boost ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-sm text-purple-300 mb-2">💡 Voice Testing Tip</p>
              <p className="text-xs text-gray-400">
                Adjust the settings above and click "Test Voice" to hear how they affect the voice quality. 
                The test will use a sample Bible-themed message to help you find the perfect voice for your spiritual companion.
              </p>
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
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};