import OpenAI from 'openai';
import { IMessage } from '../models/conversation';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIResponse {
  message: string;
  audioUrl?: string;
  processingTime?: number;
  sentiment?: string;
  intents?: string[];
}

export const processMessage = async (
  message: string, 
  conversationHistory: IMessage[]
): Promise<AIResponse> => {
  try {
    const startTime = Date.now();
    
    const formattedMessages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    formattedMessages.unshift({
      role: 'system',
      content: `You are ConversAI, a helpful customer service voice assistant. 
      Be concise, friendly, and helpful. Provide clear and direct responses.
      Current date: ${new Date().toISOString().split('T')[0]}`
    });
    
    formattedMessages.push({
      role: 'user',
      content: message
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: formattedMessages as any,
    });
    
    const aiMessage = completion.choices[0].message?.content || 'I apologize, but I couldn\'t process your request.';
    const processingTime = Date.now() - startTime;
    
    const sentiment = getSentiment(message);
    const intents = extractIntents(message);
    
    return {
      message: aiMessage,
      processingTime,
      sentiment,
      intents
    };
  } catch (error) {
    console.error('Error in AI service:', error);
    return {
      message: 'I apologize, but I encountered an error processing your request.',
      processingTime: 0,
      sentiment: 'neutral',
      intents: ['error']
    };
  }
};

const getSentiment = (text: string): string => {
  const positiveWords = ['happy', 'great', 'excellent', 'good', 'love', 'like', 'thank'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'upset'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  const words = text.toLowerCase().split(/\W+/);
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
};

const extractIntents = (text: string): string[] => {
  const intents = [];
  
  if (/\b(how|what|where|when|why|who)\b/i.test(text)) {
    intents.push('question');
  }
  
  if (/\b(help|assist|support)\b/i.test(text)) {
    intents.push('support');
  }
  
  if (/\b(buy|purchase|order|book)\b/i.test(text)) {
    intents.push('purchase');
  }
  
  if (/\b(cancel|refund|return)\b/i.test(text)) {
    intents.push('cancellation');
  }
  
  if (intents.length === 0) {
    intents.push('general');
  }
  
  return intents;
}; 