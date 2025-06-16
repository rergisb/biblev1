import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, History, User, Menu, X } from 'lucide-react';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { ChatMessage } from './components/ChatMessage';
import { TypewriterText } from './components/TypewriterText';
import { UserProfile } from './components/UserProfile';
import { ChatHistory } from './components/ChatHistory';
import { AIVoiceInput } from './components/ui/ai-voice-input';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useLocalStorage } from './hooks/useLocalStorage';
import { synthesizeSpeech, playAudioBuffer } from './services/elevenLabsService';
import { generateAIResponse } from './services/aiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioBuffer?: ArrayBuffer;
  confidence?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    confidence
  } = useSpeechRecognition();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Play welcome greeting
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
      } finally {
        setIsPlayingGreeting(false);
      }
    };

    const timer = setTimeout(playWelcomeGreeting, 1000);
    return () => clearTimeout(timer);
  }, [hasPlayedGreeting, browserSupportsSpeechRecognition]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript, confidence);
      resetTranscript();
    }
  }, [transcript, isListening, confidence]);

  // Save current session
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
      const updatedSession: ChatSession = {
        id: currentSessionId,
        title: messages[0]?.text.slice(0, 50) + '...' || 'New Conversation',
        messages,
        timestamp: new Date()
      };

      if (sessionIndex >= 0) {
        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex] = updatedSession;
        setSessions(updatedSessions);
      } else {
        setSessions([updatedSession, ...sessions]);
      }
    }
  }, [messages, currentSessionId, sessions, setSessions]);

  const handleUserMessage = async (userText: string, confidenceScore?: number) => {
    if (!userText.trim()) return;

    // Create new session if none exists
    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date(),
      confidence: confidenceScore
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setIsTyping(true);
    setError(null);

    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const aiText = await generateAIResponse(userText);
      setCurrentResponse(aiText);
      
      // Wait for typewriter effect to complete
      await new Promise(resolve => setTimeout(resolve, aiText.length * 50 + 1000));
      
      const audioBuffer = await synthesizeSpeech(aiText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
        audioBuffer
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentResponse('');
      setIsTyping(false);
      
      // Auto-play response with haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      setIsPlayingAudio(aiMessage.id);
      await playAudioBuffer(audioBuffer);
      setIsPlayingAudio(null);
      
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Connection error. Please check your network and try again.');
      setIsTyping(false);
      setCurrentResponse('');
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

  const startNewSession = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    setCurrentResponse('');
    setIsTyping(false);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
    setError(null);
    setCurrentResponse('');
    setIsTyping(false);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    startListening();
  };

  const handleVoiceStop = (duration: number) => {
    setIsRecording(false);
    stopListening();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-4">Browser Not Supported</h1>
          <p className="text-gray-300">
            Your browser doesn't support speech recognition. Please use Chrome, Safari, or another modern browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0067D2]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex flex-col h-screen">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
              confidence={message.confidence}
              onPlayAudio={
                message.audioBuffer
                  ? () => handlePlayAudio(message.id, message.audioBuffer!)
                  : undefined
              }
              isPlaying={isPlayingAudio === message.id}
            />
          ))}
          
          {/* Typing Indicator */}
          {isTyping && currentResponse && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 mr-16">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-[#0067D2] to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-300">Neural Assistant</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#0067D2] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#0067D2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#0067D2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <TypewriterText text={currentResponse} speed={50} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Voice Interface - Replace the old interface with the new AI Voice Input */}
        <AIVoiceInput
          onStart={handleVoiceStart}
          onStop={handleVoiceStop}
          visualizerBars={48}
          className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl"
        />

        {/* Status Display */}
        <div className="text-center mt-4">
          {isPlayingGreeting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[#0067D2] rounded-full animate-pulse"></div>
              <p className="text-[#0067D2] font-medium">Neural interface initializing...</p>
            </div>
          ) : isRecording ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <p className="text-red-400 font-medium">Listening... Speak now</p>
            </div>
          ) : transcript ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-gray-300">
                <span className="text-[#0067D2] font-medium">Recognized:</span> "{transcript}"
                {confidence && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({Math.round(confidence * 100)}% confidence)
                  </span>
                )}
              </p>
            </div>
          ) : null}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#0067D2] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-300">Processing neural patterns...</span>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <ChatHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        sessions={sessions}
        onLoadSession={loadSession}
        onDeleteSession={(sessionId) => {
          setSessions(sessions.filter(s => s.id !== sessionId));
        }}
      />
    </div>
  );
}

export default App;