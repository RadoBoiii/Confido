// File: frontend/src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name}!
            </h1>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/call"
                className="bg-indigo-600 text-white p-6 rounded-lg shadow hover:bg-indigo-700 transition-colors"
              >
                <h2 className="text-xl font-semibold mb-2">Start New Call</h2>
                <p className="text-indigo-100">
                  Practice your conversation skills with our AI-powered call simulator
                </p>
              </Link>

              <Link
                to="/conversations"
                className="bg-white p-6 rounded-lg shadow hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-900">View Conversations</h2>
                <p className="text-gray-600">
                  Review your past conversations and track your progress
                </p>
              </Link>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">Your Stats</h2>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Total Calls:</span> 0
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Average Rating:</span> N/A
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Last Practice:</span> Never
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Tips</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Remember to speak clearly and confidently during your practice calls. The AI will provide feedback on your communication style.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;