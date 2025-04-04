import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

interface Conversation {
  _id: string;
  title: string;
  metadata: {
    created: string;
    updated: string;
    duration: number;
    sentiment: string;
  };
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    audioUrl?: string;
  }[];
}

interface AgentState {
  agentId: string;
  agentName: string;
  companyName: string;
}

const AgentHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { agentName } = useParams<{ agentName: string }>();
  const agentState = location.state as AgentState;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentState) {
      navigate('/agents');
      return;
    }

    fetchConversations();
  }, [agentState]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`/api/conversations`, {
        params: {
          agentId: agentState.agentId
        }
      });
      console.log('Fetched conversations:', response.data); // Debug log
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Conversation History</h1>
            <p className="text-white/70">{agentState?.agentName} - {agentState?.companyName}</p>
          </div>
          <button
            onClick={() => navigate('/agents')}
            className="px-4 py-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300"
          >
            Back to Agents
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4 bg-red-500/10 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-4 h-[calc(100vh-12rem)] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Conversations</h2>
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => handleConversationClick(conversation)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <p className="font-medium truncate">{conversation.title}</p>
                    <p className="text-sm opacity-70">
                      {format(new Date(conversation.metadata.created), 'MMM d, yyyy h:mm a')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-4 h-[calc(100vh-12rem)] overflow-y-auto">
              {selectedConversation ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    {selectedConversation.title}
                  </h2>
                  {selectedConversation.messages
                    .filter((message) => message.role !== 'system')
                    .map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                          {message.audioUrl && (
                            <audio
                              controls
                              className="mt-2"
                              src={`http://localhost:5001${message.audioUrl}`}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/50">
                  <p className="text-lg">Select a conversation to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentHistory; 