// File: backend/src/index.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Conversation from './models/conversation';
import OpenAI from 'openai';

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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversai';
  console.log('Attempting MongoDB connection to:', mongoUri);
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Successfully connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Initial connection attempt
connectWithRetry();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_message', async (data) => {
    try {
      // Emit typing indicator
      socket.emit('typing', true);

      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Add user message
      const userMessage = {
        role: 'user' as const,
        content: data.message,
        timestamp: new Date()
      };
      conversation.messages.push(userMessage);

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I am having trouble generating a response.';

      // Convert AI response to speech
      const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: aiResponse
      });

      // Save audio file
      const audioFileName = `response-${Date.now()}.mp3`;
      const audioPath = path.join(__dirname, '..', 'public', 'audio', audioFileName);
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      await fs.promises.writeFile(audioPath, audioBuffer);

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date(),
        audioUrl: `/audio/${audioFileName}`
      };
      conversation.messages.push(aiMessage);

      await conversation.save();

      // Emit the AI response
      socket.emit('ai_response', {
        message: aiResponse,
        audioUrl: `/audio/${audioFileName}`
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