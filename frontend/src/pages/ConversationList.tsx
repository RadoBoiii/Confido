// File: frontend/src/pages/Conversations.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ChatBubbleLeftRightIcon, PhoneIcon, TrashIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    duration: number;
    sentiment: string;
  };
}

const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/conversations');
        setConversations(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch conversations');
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Your Conversations</h1>
          <button
            onClick={() => navigate('/company-agent')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Create Company Agent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              onClick={() => navigate(`/conversations/${conversation._id}`)}
              className="glass-container p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <h2 className="text-xl font-semibold mb-2">{conversation.title}</h2>
              <div className="text-sm text-white/70 space-y-1">
                <p>Created: {format(new Date(conversation.createdAt), 'MMM d, yyyy')}</p>
                <p>Duration: {formatDuration(conversation.metadata.duration)}</p>
                <p>Sentiment: {conversation.metadata.sentiment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;