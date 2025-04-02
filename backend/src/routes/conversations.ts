import express, { Request } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import Conversation from '../models/conversation';
import path from 'path';
import fs from 'fs';
import { Types } from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure audio directory exists
const audioDir = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper function to save audio file
const saveAudioFile = async (buffer: Buffer, fileName: string): Promise<string> => {
  try {
    const audioPath = path.join(audioDir, fileName);
    await fs.promises.writeFile(audioPath, buffer);
    return `/audio/${fileName}`;
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
};

// Add your conversation routes here
router.get('/', (req, res) => {
  res.json({ message: 'Get conversations route' });
});

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const tempUserId = new Types.ObjectId();
    const systemMessage = {
      role: 'system',
      content: 'You are a friendly and helpful AI assistant. Be concise but engaging in your responses. Use a conversational tone while maintaining professionalism.',
      timestamp: new Date()
    };
    
    const welcomeMessage = {
      role: 'assistant',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      timestamp: new Date()
    };

    const conversation = await Conversation.create({
      userId: tempUserId,
      title: req.body.title || 'New Conversation',
      messages: [systemMessage, welcomeMessage]
    });

    // Only send the welcome message to the client, not the system message
    const responseData = {
      ...conversation.toObject(),
      messages: [welcomeMessage]
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Handle audio messages
router.post('/:conversationId/audio', upload.single('audio'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { transcript } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user's audio message
    conversation.messages.push({
      role: 'user',
      content: transcript,
      timestamp: new Date(),
      audioUrl: `/audio/${req.file?.filename}`
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';

    // Convert AI response to speech
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponse
    });

    // Save audio file
    const audioFileName = `${Date.now()}-response.mp3`;
    const buffer = Buffer.from(await speech.arrayBuffer());
    const audioUrl = await saveAudioFile(buffer, audioFileName);

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      audioUrl
    });

    await conversation.save();

    res.json({
      message: 'Audio message processed successfully',
      aiResponse,
      audioUrl
    });
  } catch (error) {
    console.error('Error processing audio message:', error);
    res.status(500).json({ error: 'Failed to process audio message' });
  }
});

// Get conversation messages
router.get('/:id/messages', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json(conversation.messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error getting messages' });
  }
});

// Add message to conversation
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, role } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user message
    conversation.messages.push({
      role: role || 'user',
      content,
      timestamp: new Date()
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';

    // Convert AI response to speech
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponse
    });

    // Save audio file
    const audioFileName = `${Date.now()}-response.mp3`;
    const buffer = Buffer.from(await speech.arrayBuffer());
    const audioUrl = await saveAudioFile(buffer, audioFileName);

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      audioUrl
    });

    await conversation.save();

    res.json({
      message: 'Message added successfully',
      aiResponse,
      audioUrl
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router; 