import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { ArrowLeftIcon, ClockIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// Helper function to safely format dates
const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return isValid(date) ? format(date, 'h:mm a') : 'Invalid time';
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioUrl?: string;
  company?: string;
}

interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  metadata: {
    duration: number;
    sentiment: string;
    created: string;
    updated: string;
  };
}

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/conversations/${id}`);
      setConversation(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: { [key: string]: string } = {
      positive: 'bg-green-500/30 text-green-300 border-green-500/30',
      neutral: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
      negative: 'bg-red-500/30 text-red-300 border-red-500/30',
      urgent: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
    };
    return colors[sentiment.toLowerCase()] || colors.neutral;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = (messageId: string) => {
    setIsPlaying(messageId);
  };

  const handleAudioEnd = () => {
    setIsPlaying(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-container rounded-3xl p-12 animate-fadeIn">
            <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-float" />
            <h2 className="text-2xl font-semibold mb-4">Conversation not found</h2>
            <p className="text-gray-400 mb-8">The conversation you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/conversations')}
              className="px-6 py-3 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto backdrop-blur-xl border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Conversations</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8 animate-fadeIn">
          <div>
            <button
              onClick={() => navigate('/conversations')}
              className="mb-4 text-white/80 hover:text-white flex items-center transition-all duration-300 hover:scale-105"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Conversations
            </button>
            <h1 className="text-3xl font-bold gradient-text">{conversation.title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white/70">
              <ClockIcon className="h-5 w-5" />
              <span>{formatTimestamp(conversation.metadata.created)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5 text-white/70" />
              <span className="text-white/70">{formatDuration(conversation.metadata.duration)}</span>
            </div>
            <div className={`px-4 py-1 rounded-full text-sm font-medium ${getSentimentColor(conversation.metadata.sentiment)} border`}>
              {conversation.metadata.sentiment.charAt(0).toUpperCase() + conversation.metadata.sentiment.slice(1)}
            </div>
          </div>
        </div>

        <div className="glass-container rounded-3xl p-6 mb-8 animate-fadeIn">
          <div className="space-y-6">
            {conversation.messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end space-x-3 animate-slideIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.role === 'assistant' && (
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-600 ring-2 ring-white/30 animate-scaleIn`}>
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDgtMy41OSA4LTggOHptMC0xNGMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6Ii8+PC9zdmc+"
                      alt="AI Assistant"
                      className="w-full h-full object-contain p-1"
                    />
                    {isPlaying === `message-${index}` && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[80%] group transform transition-all duration-300 hover:scale-[1.02] ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                  <div className={`px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600/80 text-white rounded-br-sm border border-blue-400/30'
                      : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/20'
                  }`}>
                    <div className="flex items-center mb-2">
                      <span className={`text-sm font-medium ${message.role === 'user' ? 'text-blue-100' : 'text-white/80'}`}>
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className={`mx-2 text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-white/50'}`}>•</span>
                      <span className={`text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-white/50'}`}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.audioUrl && (
                      <div className="mt-3">
                        <audio
                          controls
                          className="w-full h-8 rounded-lg opacity-70 hover:opacity-100 transition-opacity duration-300"
                          onPlay={() => handleAudioPlay(`message-${index}`)}
                          onPause={handleAudioEnd}
                          onEnded={handleAudioEnd}
                        >
                          <source src={`http://localhost:5001${message.audioUrl}`} type="audio/mp3" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center ring-2 ring-white/30 animate-scaleIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail; 