import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, Trash2, Settings } from 'lucide-react';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { ChatMessage } from './components/ChatMessage';
import { ApiTestModal } from './components/ApiTestModal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { synthesizeSpeech, playAudioBuffer } from './services/elevenLabsService';
import { generateAIResponse } from './services/aiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioBuffer?: ArrayBuffer;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiTest, setShowApiTest] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Play welcome greeting on page load
  useEffect(() => {
    const playWelcomeGreeting = async () => {
      if (hasPlayedGreeting || !browserSupportsSpeechRecognition) return;
      
      try {
        setIsPlayingGreeting(true);
        const greetingText = "Hello, touch your screen to start talking";
        const audioBuffer = await synthesizeSpeech(greetingText);
        await playAudioBuffer(audioBuffer);
        setHasPlayedGreeting(true);
      } catch (error) {
        console.error('Error playing welcome greeting:', error);
        // Don't show error to user for greeting, just log it
      } finally {
        setIsPlayingGreeting(false);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(playWelcomeGreeting, 1000);
    return () => clearTimeout(timer);
  }, [hasPlayedGreeting, browserSupportsSpeechRecognition]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleUserMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      // Generate AI response
      const aiText = await generateAIResponse(userText);
      
      // Generate audio for AI response
      const audioBuffer = await synthesizeSpeech(aiText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
        audioBuffer
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-play the AI response
      setIsPlayingAudio(aiMessage.id);
      await playAudioBuffer(audioBuffer);
      setIsPlayingAudio(null);
      
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Sorry, I encountered an error processing your message. Please check your API connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayAudio = async (messageId: string, audioBuffer: ArrayBuffer) => {
    if (isPlayingAudio) return;
    
    try {
      setIsPlayingAudio(messageId);
      await playAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsPlayingAudio(null);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const replayGreeting = async () => {
    if (isPlayingGreeting || isPlayingAudio) return;
    
    try {
      setIsPlayingGreeting(true);
      const greetingText = "Hello, touch your screen to start talking";
      const audioBuffer = await synthesizeSpeech(greetingText);
      await playAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Error replaying greeting:', error);
      setError('Failed to play greeting. Please check your API connection.');
    } finally {
      setIsPlayingGreeting(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Browser Not Supported</h1>
          <p className="text-gray-600">
            Your browser doesn't support speech recognition. Please use Chrome, Safari, or another modern browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Voice Assistant</h1>
              <p className="text-sm text-gray-600">Powered by ElevenLabs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setShowApiTest(true)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              title="Test API connection"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-88px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a Conversation</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                {isPlayingGreeting 
                  ? "🔊 Playing welcome message..." 
                  : "Click the microphone button below to start talking. I'll listen to your voice and respond with natural speech."
                }
              </p>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowApiTest(true)}
                  className="text-purple-600 hover:text-purple-700 underline text-sm"
                >
                  Test API Connection
                </button>
                {hasPlayedGreeting && (
                  <button
                    onClick={replayGreeting}
                    disabled={isPlayingGreeting}
                    className="text-emerald-600 hover:text-emerald-700 underline text-sm disabled:opacity-50"
                  >
                    {isPlayingGreeting ? "Playing..." : "Replay Welcome Message"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                onPlayAudio={
                  message.audioBuffer
                    ? () => handlePlayAudio(message.id, message.audioBuffer!)
                    : undefined
                }
                isPlaying={isPlayingAudio === message.id}
              />
            ))
          )}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2">Processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setShowApiTest(true)}
              className="text-red-700 hover:text-red-800 underline text-sm mt-1"
            >
              Test API Connection
            </button>
          </div>
        )}

        {/* Voice Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          {/* Voice Visualizer */}
          <div className="mb-6">
            <VoiceVisualizer
              isRecording={isListening}
              isPlaying={isPlayingAudio !== null || isPlayingGreeting}
              audioLevel={isListening ? 0.7 : 0}
            />
          </div>

          {/* Status */}
          <div className="text-center mb-4">
            {isPlayingGreeting ? (
              <p className="text-emerald-600 font-medium">🔊 Welcome! Touch your screen to start talking</p>
            ) : isListening ? (
              <p className="text-red-600 font-medium">🎤 Listening... Speak now!</p>
            ) : transcript ? (
              <p className="text-gray-600">Recognized: "{transcript}"</p>
            ) : (
              <p className="text-gray-600">Click the microphone to start speaking</p>
            )}
          </div>

          {/* Record Button */}
          <div className="flex justify-center">
            <button
              onClick={toggleRecording}
              disabled={isProcessing || isPlayingGreeting}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 shadow-lg shadow-purple-500/30'
              } ${(isProcessing || isPlayingGreeting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* API Test Modal */}
      <ApiTestModal 
        isOpen={showApiTest} 
        onClose={() => setShowApiTest(false)} 
      />
    </div>
  );
}

export default App;