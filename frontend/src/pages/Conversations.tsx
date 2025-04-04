// File: frontend/src/pages/Conversations.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ChatBubbleLeftRightIcon, PhoneIcon, TrashIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Conversation {
  _id: string;
  title: string;
  messages: Array<{
    content: string;
    role: string;
    timestamp: string;
  }>;
  metadata: {
    duration: number;
    sentiment: string;
    created: string;
    updated: string;
  };
}

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/conversations');
      setConversations(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5001/api/conversations/${id}`);
      setConversations(prev => prev.filter(conv => conv._id !== id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: { [key: string]: string } = {
      positive: 'bg-green-500/30 text-green-300 border-green-500/30',
      neutral: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
      negative: 'bg-red-500/30 text-red-300 border-red-500/30'
    };
    return colors[sentiment] || colors.neutral;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleViewConversation = (id: string) => {
    navigate(`/conversations/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text animate-fadeIn">Conversation History</h1>
          <button
            onClick={() => navigate('/call-simulator')}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300"
          >
            Start New Call
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="glass-container rounded-3xl p-12 text-center animate-fadeIn">
            <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-float" />
            <h2 className="text-2xl font-semibold mb-4">No conversations yet</h2>
            <p className="text-gray-400 mb-8">Start a new call to begin your first conversation</p>
            <button
              onClick={() => navigate('/call-simulator')}
              className="px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Start New Call</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => handleViewConversation(conversation._id)}
                className="glass-container rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-blue-500/10 animate-fadeIn"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold truncate">{conversation.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conversation._id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <TrashIcon className="h-5 w-5 text-red-400" />
                  </button>
                </div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm ${getSentimentColor(conversation.metadata.sentiment)}`}>
                    {conversation.metadata.sentiment}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{formatDuration(conversation.metadata.duration)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {format(new Date(conversation.metadata.created), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;