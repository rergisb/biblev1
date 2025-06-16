import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Volume2, Settings, Loader } from 'lucide-react';
import { testApiConnection, getAvailableVoices, synthesizeSpeech, playAudioBuffer, VoiceSettings, defaultVoiceSettings } from '../services/elevenLabsService';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

interface ApiTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiTestModal: React.FC<ApiTestModalProps> = ({ isOpen, onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [testText, setTestText] = useState('Hello! This is a test of the ElevenLabs voice synthesis.');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const isConnected = await testApiConnection();
      if (isConnected) {
        setConnectionStatus('success');
        await loadVoices();
      } else {
        setConnectionStatus('error');
        setError('Failed to connect to ElevenLabs API. Please check your API key.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const loadVoices = async () => {
    try {
      const voicesData = await getAvailableVoices();
      setVoices(voicesData.voices || []);
    } catch (err) {
      console.error('Error loading voices:', err);
      setError('Failed to load available voices');
    }
  };

  const testVoice = async () => {
    if (!testText.trim()) return;
    
    setIsPlayingTest(true);
    try {
      const audioBuffer = await synthesizeSpeech(testText, selectedVoice, voiceSettings);
      await playAudioBuffer(audioBuffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test voice');
    } finally {
      setIsPlayingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">API Connection Test</h2>
              <p className="text-sm text-gray-600">Test your ElevenLabs API connection and voice settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Connection Status */}
          <div className="bg-gray-50/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold text-gray-800">Connection Status</h3>
              {connectionStatus === 'testing' && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
              {connectionStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {connectionStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
            
            <div className={`p-3 rounded-lg ${
              connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
              connectionStatus === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {connectionStatus === 'testing' && 'Testing API connection...'}
              {connectionStatus === 'success' && 'API connection successful! Ready to use ElevenLabs voices.'}
              {connectionStatus === 'error' && (error || 'Failed to connect to ElevenLabs API')}
              {connectionStatus === 'idle' && 'Click "Test Connection" to verify your API setup.'}
            </div>

            <button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-emerald-500 text-white rounded-lg hover:from-purple-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
            >
              {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Voice Selection */}
          {connectionStatus === 'success' && voices.length > 0 && (
            <div className="bg-gray-50/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Voice Selection</h3>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Voice Settings */}
          {connectionStatus === 'success' && (
            <div className="bg-gray-50/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Voice Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stability: {voiceSettings.stability}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.stability}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, stability: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher values make the voice more stable but less expressive</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Similarity Boost: {voiceSettings.similarity_boost}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.similarity_boost}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, similarity_boost: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher values make the voice more similar to the original</p>
                </div>

                {voiceSettings.style !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Style: {voiceSettings.style}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.style}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, style: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Controls the style and emotion of the voice</p>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="speaker-boost"
                    checked={voiceSettings.use_speaker_boost || false}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, use_speaker_boost: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="speaker-boost" className="text-sm font-medium text-gray-700">
                    Use Speaker Boost
                  </label>
                  <p className="text-xs text-gray-500 ml-2">Enhances voice clarity and quality</p>
                </div>
              </div>
            </div>
          )}

          {/* Voice Test */}
          {connectionStatus === 'success' && (
            <div className="bg-gray-50/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Test Voice</h3>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test the voice..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                onClick={testVoice}
                disabled={isPlayingTest || !testText.trim()}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
              >
                {isPlayingTest ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Test Voice
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200/50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};