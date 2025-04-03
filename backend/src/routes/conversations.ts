import express, { Request } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import Conversation, { IMessage } from '../models/conversation';
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

// Add helper function for personality traits
const getRandomPersonality = () => {
  const personalities = [
    "friendly and conversational",
    "warm and personable",
    "engaging and natural",
    "approachable and genuine",
    "casual yet professional"
  ];
  return personalities[Math.floor(Math.random() * personalities.length)];
};

// Add helper function for generating proactive responses
const generateProactiveResponse = async (messages: Array<{ role: IMessage['role']; content: string }>, openai: OpenAI) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...messages,
        {
          role: "system",
          content: `You are a friendly AI assistant having a natural conversation. Keep these points in mind:
1. Use a casual, warm tone while remaining professional
2. Respond naturally as a friend would, with appropriate enthusiasm
3. Show genuine interest in the conversation
4. Use conversational language and avoid formal or robotic responses
5. Mirror the user's tone and energy level
6. Include subtle conversational elements like "hmm", "you know", "actually" when appropriate
7. Break up longer responses into natural-sounding chunks
8. Use friendly acknowledgments like "I see", "Got it", "Makes sense"

For example, instead of "I am here to assist you with your inquiry", say something like "Hey there! What's on your mind?" or "I'd love to help you figure this out."

Keep the conversation flowing naturally while being genuinely helpful.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      frequency_penalty: 0.7,
      presence_penalty: 0.6
    });

    return completion.choices[0]?.message?.content || "Hey! Sorry about that, I got a bit distracted. What were you saying?";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

// Get all conversations
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ 'metadata.created': -1 });
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a single conversation by ID
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add context summary for continued conversations
    const contextMessages = conversation.messages
      .filter(msg => msg.role !== 'system');

    const response = {
      ...conversation.toObject(),
      messages: contextMessages.map(msg => ({
        ...msg,
        formattedTimestamp: new Date(msg.timestamp).toLocaleString()
      })),
      context: {
        company: detectCompanyFromMessages(contextMessages),
        lastActive: conversation.metadata.updated,
        summary: await generateConversationSummary(contextMessages)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Helper function to detect company from messages
const detectCompanyFromMessages = (messages: IMessage[]): string => {
  const messageText = messages.map(msg => msg.content).join(' ').toLowerCase();
  const companies = ['amazon', 'netflix', 'pizza hut', 'apple'];
  return companies.find(company => messageText.includes(company)) || 'general';
};

// Helper function to generate conversation summary
const generateConversationSummary = async (messages: IMessage[]): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate a brief 1-2 sentence summary of the conversation context. Focus on the main issue or topic being discussed."
        },
        {
          role: "user",
          content: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return completion.choices[0]?.message?.content || "Previous conversation context not available.";
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return "Previous conversation context not available.";
  }
};

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const tempUserId = new Types.ObjectId();
    const personality = getRandomPersonality();
    
    const systemMessage = {
      role: 'system',
      content: `You are a ${personality} AI assistant. Your goal is to have natural, engaging conversations while being helpful. Remember to:

1. Keep the tone casual and friendly
2. Use natural language patterns
3. Show genuine interest and enthusiasm
4. Be conversational while remaining professional
5. Match the user's communication style
6. Use friendly acknowledgments and transitions
7. Break up responses into natural chunks
8. Include appropriate emotional responses

Maintain a natural flow of conversation as if chatting with a friend while being genuinely helpful.`,
      timestamp: new Date()
    };

    // Get current hour for time-based greeting
    const hour = new Date().getHours();
    let timeBasedGreeting = "";
    if (hour < 12) timeBasedGreeting = "Morning!";
    else if (hour < 17) timeBasedGreeting = "Afternoon!";
    else timeBasedGreeting = "Evening!";

    const casualGreetings = [
      "Hey there! ",
      "Hi! ",
      "Hello! ",
      "Hey! ",
      "Hi there! "
    ];

    const welcomePhrases = [
      "What's on your mind?",
      "How can I make your day better?",
      "What would you like to chat about?",
      "What brings you here today?",
      "How can I help you out?"
    ];
    
    const greeting = casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
    const welcomePhrase = welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)];
    
    const welcomeMessage = {
      role: 'assistant',
      content: `${greeting}${timeBasedGreeting} ${welcomePhrase}`,
      timestamp: new Date()
    };

    const conversation = await Conversation.create({
      userId: tempUserId,
      title: req.body.title || `Chat from ${new Date().toLocaleDateString()}`,
      messages: [systemMessage, welcomeMessage],
      metadata: {
        duration: 0,
        sentiment: 'neutral',
        intents: [],
        created: new Date(),
        updated: new Date()
      }
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

// Delete a conversation
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Delete associated audio files
    conversation.messages.forEach(message => {
      if (message.audioUrl) {
        const audioPath = path.join(__dirname, '../..', message.audioUrl);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    });

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
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

// Update the message handling route
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, role } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const now = new Date();

    // Add user message
    const userMessage: IMessage = {
      role: role as 'user' | 'assistant' | 'system',
      content,
      timestamp: now
    };
    conversation.messages.push(userMessage);

    // Get conversation context (last few messages)
    const contextMessages = conversation.messages
      .slice(-5) // Get last 5 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate AI response
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    const aiResponseContent = await generateProactiveResponse(contextMessages, openai);

    // Add AI response to conversation
    const aiMessage: IMessage = {
      role: 'assistant',
      content: aiResponseContent,
      timestamp: now
    };
    conversation.messages.push(aiMessage);

    // Update conversation metadata
    conversation.metadata.updated = now;
    conversation.metadata.duration = Math.floor(
      (now.getTime() - conversation.metadata.created.getTime()) / 1000
    );

    // Analyze sentiment and update metadata
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze the sentiment of the conversation. Respond with exactly one word: positive, negative, urgent, or neutral."
        },
        {
          role: "user",
          content: conversation.messages.map(msg => msg.content).join('\n')
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const sentiment = sentimentResponse.choices[0]?.message?.content?.toLowerCase() || 'neutral';
    conversation.metadata.sentiment = sentiment;

    // Generate title if this is the first user message
    if (conversation.messages.filter(msg => msg.role === 'user').length === 1) {
      const titleResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Generate a short, descriptive title for this conversation. The title should:
1. Be concise (3-6 words)
2. Capture the main topic or issue
3. Include the company name if relevant
4. Be written in title case

Example formats:
- "Netflix Login Issue"
- "Amazon Refund Request"
- "Pizza Hut Delivery Delay"
- "Account Access Problem"`
          },
          {
            role: "user",
            content: conversation.messages.map(msg => msg.content).join('\n')
          }
        ],
        temperature: 0.7,
        max_tokens: 60
      });

      const title = titleResponse.choices[0]?.message?.content || conversation.title;
      conversation.title = title;
    }

    // Convert AI response to speech using OpenAI's TTS
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: aiResponseContent
    });

    // Save audio file
    const audioFileName = `response-${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '..', '..', 'public', 'audio', audioFileName);
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    await fs.promises.writeFile(audioPath, audioBuffer);

    // Update AI message with audio URL
    const audioUrl = `/audio/${audioFileName}`;
    aiMessage.audioUrl = audioUrl;
    
    await conversation.save();

    // Convert timestamps to ISO strings for the response
    const responseMessage = {
      ...aiMessage,
      timestamp: aiMessage.timestamp instanceof Date 
        ? aiMessage.timestamp.toISOString() 
        : aiMessage.timestamp
    };

    res.json({
      message: responseMessage,
      audioUrl,
      title: conversation.title
    });

  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router; 