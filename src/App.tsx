import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { ApiConfigModal } from './components/ApiConfigModal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { synthesizeSpeech, playAudioBuffer } from './services/elevenLabsService';
import { generateGeminiResponse } from './services/geminiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioBuffer?: ArrayBuffer;
  confidence?: number;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [pendingTranscript, setPendingTranscript] = useState<string>('');

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    confidence
  } = useSpeechRecognition();

  // Sync recording state with speech recognition
  useEffect(() => {
    setIsRecording(isListening);
  }, [isListening]);

  // Play welcome greeting
  useEffect(() => {
    const playWelcomeGreeting = async () => {
      if (hasPlayedGreeting || !browserSupportsSpeechRecognition) return;
      
      try {
        setIsPlayingGreeting(true);
        const greetingText = "Hello there! Want to read a verse or get some Bible advice? Tap anywhere to start.";
        const audioBuffer = await synthesizeSpeech(greetingText);
        await playAudioBuffer(audioBuffer);
        setHasPlayedGreeting(true);
      } catch (error) {
        console.error('Error playing welcome greeting:', error);
        // Don't show error for greeting, just mark as played
        setHasPlayedGreeting(true);
      } finally {
        setIsPlayingGreeting(false);
      }
    };

    const timer = setTimeout(playWelcomeGreeting, 1500);
    return () => clearTimeout(timer);
  }, [hasPlayedGreeting, browserSupportsSpeechRecognition]);

  // Handle transcript changes - process immediately when we have a final transcript
  useEffect(() => {
    if (transcript && transcript.trim()) {
      console.log('Transcript received:', transcript, 'isListening:', isListening);
      
      // If we're not listening anymore, process the transcript immediately
      if (!isListening) {
        handleUserMessage(transcript, confidence);
        setCurrentTranscript(transcript);
        resetTranscript();
        
        // Clear transcript after showing it briefly
        setTimeout(() => {
          setCurrentTranscript('');
        }, 3000);
      } else {
        // Store the transcript while still listening
        setPendingTranscript(transcript);
      }
    }
  }, [transcript, isListening, confidence]);

  // Handle when listening stops - process any pending transcript
  useEffect(() => {
    if (!isListening && pendingTranscript && pendingTranscript.trim()) {
      console.log('Processing pending transcript:', pendingTranscript);
      handleUserMessage(pendingTranscript, confidence);
      setCurrentTranscript(pendingTranscript);
      setPendingTranscript('');
      resetTranscript();
      
      // Clear transcript after showing it briefly
      setTimeout(() => {
        setCurrentTranscript('');
      }, 3000);
    }
  }, [isListening, pendingTranscript, confidence]);

  const handleUserMessage = async (userText: string, confidenceScore?: number) => {
    if (!userText.trim() || isProcessing) return;

    console.log('Processing user message:', userText);
    setIsProcessing(true);
    setError(null);
    setLastResponse('');

    try {
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      
      // Generate AI response using Gemini - ONLY ONE CALL
      console.log('Sending to Gemini:', userText);
      const aiText = await generateGeminiResponse(userText);
      console.log('Gemini response:', aiText);
      
      setLastResponse(aiText);
      
      // Convert AI response to speech - ONLY ONE CALL
      console.log('Converting to speech...');
      const audioBuffer = await synthesizeSpeech(aiText);
      
      // Auto-play response with haptic feedback - ONLY ONE PLAYBACK
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      setIsPlayingAudio(true);
      await playAudioBuffer(audioBuffer);
      setIsPlayingAudio(false);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Gemini')) {
          setError('Unable to connect to AI service. Please check your internet connection and try again.');
        } else if (error.message.includes('ElevenLabs') || error.message.includes('speech')) {
          setError('Voice synthesis error. Please check your ElevenLabs configuration in settings.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Connection error. Please check your network and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceStart = () => {
    setError(null);
    setCurrentTranscript('');
    setLastResponse('');
    setPendingTranscript('');
    
    // Haptic feedback on start
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    startListening();
  };

  const handleVoiceStop = () => {
    // Haptic feedback on stop
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    console.log('Stopping voice recording...');
    stopListening();
  };

  // Handle tap anywhere to start conversation
  const handleScreenTap = (e: React.MouseEvent) => {
    // Only trigger if not already recording/processing and not clicking the button
    if (!isRecording && !isProcessing && !isPlayingAudio && !isPlayingGreeting) {
      const target = e.target as HTMLElement;
      // Don't trigger if clicking the actual button or config button
      if (!target.closest('button')) {
        handleVoiceStart();
      }
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900 flex items-center justify-center p-6">
        <div className="bg-black/30 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/20 shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <MicOff className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Browser Not Supported</h1>
          <p className="text-gray-300 leading-relaxed">
            Your browser doesn't support speech recognition. Please use Chrome, Safari, or another modern browser to experience the voice assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900 text-white overflow-hidden cursor-pointer"
      onClick={handleScreenTap}
    >
      {/* Configuration Button */}
      <div className="fixed top-6 right-6 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowApiConfig(true);
          }}
          className="p-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-black/30 transition-all duration-200 group"
          title="Configure ElevenLabs API"
        >
          <Settings className="w-6 h-6 text-gray-300 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
        </button>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        
        {/* Central Visualizer Area */}
        <div className="flex-1 flex items-center justify-center w-full max-w-md">
          <div className="relative">
            {/* Main Visualizer */}
            <VoiceVisualizer
              isRecording={isRecording}
              isPlaying={isPlayingAudio || isPlayingGreeting}
              audioLevel={isRecording ? 0.8 : isPlayingAudio ? 0.6 : 0.1}
            />
            
            {/* Central Status Indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                isRecording 
                  ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/30' 
                  : isPlayingAudio || isPlayingGreeting
                  ? 'bg-teal-500/20 shadow-lg shadow-teal-500/30'
                  : 'bg-gray-500/10'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-emerald-500/30 animate-pulse' 
                    : isPlayingAudio || isPlayingGreeting
                    ? 'bg-teal-500/30 animate-pulse'
                    : 'bg-gray-500/20'
                }`}>
                  <Mic className={`w-8 h-8 transition-colors duration-300 ${
                    isRecording 
                      ? 'text-emerald-300' 
                      : isPlayingAudio || isPlayingGreeting
                      ? 'text-teal-300'
                      : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Text Area */}
        <div className="w-full max-w-md space-y-4 mb-8">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          {/* AI Response Display */}
          {lastResponse && !isProcessing && !isPlayingAudio && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-teal-500/20">
              <p className="text-gray-300 text-center mb-2">
                <span className="text-teal-400 font-medium">Bible Companion:</span>
              </p>
              <p className="text-white text-sm text-center leading-relaxed">"{lastResponse}"</p>
            </div>
          )}

          {/* Status Messages */}
          <div className="text-center min-h-[60px] flex items-center justify-center">
            {isPlayingGreeting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <p className="text-teal-300 font-medium">Welcome to your Bible companion...</p>
              </div>
            ) : isRecording ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-emerald-300 font-medium">Listening...</p>
                </div>
                <p className="text-gray-400 text-sm">Share your heart or ask for guidance</p>
                {pendingTranscript && (
                  <p className="text-emerald-200 text-xs italic">"{pendingTranscript}"</p>
                )}
              </div>
            ) : isProcessing ? (
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-teal-300 font-medium">Seeking wisdom...</span>
              </div>
            ) : isPlayingAudio ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span className="text-teal-300 font-medium">🔊 Speaking God's word...</span>
              </div>
            ) : currentTranscript ? (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/20">
                <p className="text-gray-300 text-center">
                  <span className="text-emerald-400 font-medium">You said:</span>
                </p>
                <p className="text-white mt-1 text-center">"{currentTranscript}"</p>
                {confidence && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {Math.round(confidence * 100)}% confidence
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 font-medium mb-2">Ready for Bible guidance</p>
                <p className="text-gray-400 text-sm mb-1">Ask for a verse or spiritual advice</p>
                <p className="text-gray-500 text-xs">Tap anywhere to start speaking</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Interaction Button */}
        <div className="relative">
          <button
            onClick={isRecording ? handleVoiceStop : handleVoiceStart}
            disabled={isProcessing || isPlayingAudio || isPlayingGreeting}
            className={`relative w-20 h-20 rounded-full transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/40'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isRecording
                ? 'bg-red-500/20 animate-ping'
                : 'bg-emerald-500/20'
            }`}></div>
            
            {/* Button Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {isRecording ? (
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </div>
          </button>

          {/* Pulse Ring for Active States */}
          {(isRecording || isPlayingAudio) && (
            <div className={`absolute inset-0 rounded-full animate-ping ${
              isRecording 
                ? 'bg-red-500/30' 
                : 'bg-teal-500/30'
            }`}></div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>

      {/* API Configuration Modal */}
      <ApiConfigModal 
        isOpen={showApiConfig} 
        onClose={() => setShowApiConfig(false)} 
      />
    </div>
  );
}

export default App;