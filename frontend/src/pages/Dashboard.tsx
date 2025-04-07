// File: frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface UserStats {
  totalCalls: number;
  averageDuration: number;
  lastPractice: string | null;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
    urgent: number;
  };
  totalMessages: number;
  companiesInteractedWith: string[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?._id) return;
        
        const response = await fetch(`http://localhost:5001/api/conversations/stats/user/${user._id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?._id]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getLastPracticeText = (lastPractice: string | null): string => {
    if (!lastPractice) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastPractice), { addSuffix: true });
    } catch {
      return 'Never';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-container p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-white/70">
                Ready to practice your conversation skills?
              </p>
            </div>
            <Link
              to="/call-simulator"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Start New Call
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link
              to="/conversations"
              className="glass-container p-6 rounded-xl hover:scale-105 transition-all duration-300 border border-white/10 group"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  View Conversations
                </h2>
              </div>
              <p className="text-white/70">
                Review your past conversations and track your progress
              </p>
            </Link>

            <div className="glass-container p-6 rounded-xl border border-white/10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Your Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Calls</span>
                  <span className="text-white font-medium">
                    {loading ? '...' : stats?.totalCalls || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Average Duration</span>
                  <span className="text-white font-medium">
                    {loading ? '...' : formatDuration(stats?.averageDuration || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Last Practice</span>
                  <span className="text-white font-medium">
                    {loading ? '...' : getLastPracticeText(stats?.lastPractice || null)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Messages</span>
                  <span className="text-white font-medium">
                    {loading ? '...' : stats?.totalMessages || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Companies</span>
                  <span className="text-white font-medium">
                    {loading ? '...' : stats?.companiesInteractedWith.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-container p-6 rounded-xl border border-white/10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Sentiment Breakdown</h2>
              </div>
              {loading ? (
                <div className="text-white/70">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {stats?.sentimentBreakdown && Object.entries(stats.sentimentBreakdown).map(([sentiment, count]) => (
                    <div key={sentiment} className="flex justify-between items-center">
                      <span className="text-white/70 capitalize">{sentiment}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-white mb-2">
                  Ready to try out ConversAI?
                </h3>
                <p className="text-white/70">
                  Test out a conversation with Alex, our customer service representative. Use ConversAI to build your own agent for your organization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;