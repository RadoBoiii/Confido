// File: frontend/src/pages/CallSimulator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
}

const CallSimulator: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  // Connect to socket.io
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('typing', (isTyping: boolean) => {
      setIsTyping(isTyping);
    });

    socketRef.current.on('ai_response', (data: any) => {
      addMessage({
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        audioUrl: data.audioUrl
      });

      setIsProcessing(false);
      setIsTyping(false);
      
      // Play audio response
      if (data.audioUrl) {
        const audio = new Audio(`http://localhost:5001${data.audioUrl}`);
        audio.play();
      } else {
        // Fallback to browser's text-to-speech if no audio URL
        const speech = new SpeechSynthesisUtterance(data.message);
        window.speechSynthesis.speak(speech);
      }
    });

    socketRef.current.on('error', (error: any) => {
      console.error('Socket error:', error);
      setIsProcessing(false);
      setIsTyping(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new conversation if needed
  useEffect(() => {
    createConversation();
  }, []);

  const createConversation = async () => {
    try {
      const res = await axios.post('http://localhost:5001/api/conversations', {
        title: `Call at ${new Date().toLocaleString()}`
      });
      
      setConversationId(res.data._id);
      
      // Add welcome message
      addMessage({
        id: Date.now().toString(),
        content: "Hello! How can I assist you today?",
        role: 'assistant',
        timestamp: new Date()
      });

      // Speak welcome message
      const speech = new SpeechSynthesisUtterance("Hello! How can I assist you today?");
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
          
          setInputMessage(transcript);
        };
        
        recognitionRef.current.start();
      }
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        if (inputMessage) {
          // Send both audio and transcript
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('transcript', inputMessage);
          
          try {
            await axios.post(`http://localhost:5001/api/conversations/${conversationId}/audio`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            handleSendMessage();
          } catch (error) {
            console.error('Error sending audio:', error);
            // Fallback to text-only message
            handleSendMessage();
          }
        }
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setIsProcessing(true);
    
    try {
      // Send message to backend
      socketRef.current.emit('user_message', {
        conversationId,
        message: inputMessage
      });
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Call Simulator</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="h-96 overflow-y-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
            >
              <p>{message.content}</p>
              {message.audioUrl && (
                <audio controls className="mt-2 w-full">
                  <source src={`http://localhost:5001${message.audioUrl}`} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="bg-gray-100 mr-auto max-w-[80%] p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg"
            disabled={isRecording}
          />
          
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-2 rounded-lg ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            disabled={isProcessing}
          >
            {isRecording ? (
              <StopIcon className="h-6 w-6" />
            ) : (
              <MicrophoneIcon className="h-6 w-6" />
            )}
          </button>
          
          <button
            onClick={handleSendMessage}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg"
            disabled={!inputMessage.trim() || isProcessing}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallSimulator;