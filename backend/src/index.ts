// File: backend/src/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

// Import routes
import conversationRoutes from './routes/conversations';
import authRoutes from './routes/auth';

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Serve static files
app.use('/audio', express.static(path.join(__dirname, '..', 'public', 'audio')));

// Use routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/auth', authRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_message', async (data) => {
    try {
      // Emit typing indicator
      socket.emit('typing', true);

      // Process the message through the conversation route
      const response = await fetch(`http://localhost:5001/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: data.message, role: 'user' })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const result = await response.json();

      // Emit the AI response
      socket.emit('ai_response', {
        message: result.aiResponse,
        audioUrl: result.audioUrl
      });

    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    } finally {
      socket.emit('typing', false);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/conversai')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
  });
});