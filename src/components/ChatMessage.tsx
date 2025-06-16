import React from 'react';
import { User, Bot, Volume2 } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  onPlayAudio,
  isPlaying
}) => {
  return (
    <div className={`flex gap-3 p-4 rounded-xl transition-all duration-300 ${
      isUser 
        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 ml-8' 
        : 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 mr-8'
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-purple-500' : 'bg-emerald-500'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </span>
          {!isUser && onPlayAudio && (
            <button
              onClick={onPlayAudio}
              disabled={isPlaying}
              className={`p-1 rounded-full transition-all duration-200 ${
                isPlaying 
                  ? 'bg-emerald-500 text-white animate-pulse' 
                  : 'hover:bg-emerald-100 text-emerald-600'
              }`}
            >
              <Volume2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-gray-800 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};