import React from 'react';
import { User, MessageCircle, Volume2, Zap } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  confidence,
  onPlayAudio,
  isPlaying
}) => {
  return (
    <div className={`flex gap-4 p-6 rounded-3xl backdrop-blur-sm border transition-all duration-500 hover:scale-[1.02] ${
      isUser 
        ? 'bg-white/5 border-white/10 ml-16' 
        : 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/20 mr-16'
    }`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
        isUser 
          ? 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-600/30' 
          : 'bg-gradient-to-r from-purple-500 to-violet-500 shadow-purple-500/30'
      }`}>
        {isUser ? (
          <User className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-white">
            {isUser ? 'You' : 'Bible Companion'}
          </span>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </span>
          {confidence && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Zap className="w-3 h-3" />
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          )}
          {!isUser && onPlayAudio && (
            <button
              onClick={onPlayAudio}
              disabled={isPlaying}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                isPlaying 
                  ? 'bg-purple-500/30 text-purple-400 animate-pulse' 
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
              title="Play audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};