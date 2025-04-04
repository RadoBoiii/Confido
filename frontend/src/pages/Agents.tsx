import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Agent {
  _id: string;
  name: string;
  companyName: string;
  personality: string;
  companyInfo: string;
  prompts: string[];
  createdAt: string;
  updatedAt: string;
}

const Agents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('view');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/agents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    navigate('/agents/create');
  };

  const handleViewAgent = (agentId: string) => {
    navigate(`/agents/${agentId}`);
  };

  const handleStartCall = (agent: Agent) => {
    const encodedName = encodeURIComponent(agent.name);
    navigate(`/calls/${encodedName}`, {
      state: {
        agentId: agent._id,
        agentName: agent.name,
        companyName: agent.companyName,
        personality: agent.personality,
        companyInfo: agent.companyInfo,
        prompts: agent.prompts
      }
    });
  };

  const handleViewHistory = (agent: Agent) => {
    const encodedName = encodeURIComponent(agent.name);
    navigate(`/history/${encodedName}`, {
      state: { agentId: agent._id }
    });
  };

  const handleEditAgent = (agentId: string) => {
    navigate(`/agents/edit/${agentId}`);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/agents/${agentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchAgents();
      } catch (error) {
        console.error('Error deleting agent:', error);
      }
    }
  };

  const toggleMenu = (agentId: string) => {
    setShowMenu(showMenu === agentId ? null : agentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          <button
            onClick={handleCreateAgent}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Agent
          </button>
        </div>

        <div className="bg-black/30 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              View Agents
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Create Agent
            </button>
          </div>

          {activeTab === 'view' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : agents.length === 0 ? (
                <div className="col-span-full text-center py-12 text-white/70">
                  <p className="text-xl mb-4">No agents created yet</p>
                  <button
                    onClick={handleCreateAgent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                  >
                    Create Your First Agent
                  </button>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent._id}
                    className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{agent.name}</h3>
                        <p className="text-white/70">{agent.companyName}</p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(agent._id)}
                          className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-white/70" />
                        </button>
                        {showMenu === agent._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-white/10">
                            <button
                              onClick={() => {
                                handleEditAgent(agent._id);
                                setShowMenu(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-white/90 hover:bg-white/10 transition-all duration-300"
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit Agent
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteAgent(agent._id);
                                setShowMenu(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-white/10 transition-all duration-300"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete Agent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-white/70 mb-6 line-clamp-3">{agent.personality}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStartCall(agent)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                      >
                        Start Call
                      </button>
                      <button
                        onClick={() => handleViewHistory(agent)}
                        className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300"
                      >
                        View History
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/70 mb-4">Create a new custom AI agent for your business</p>
              <button
                onClick={handleCreateAgent}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
              >
                Create New Agent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agents; 