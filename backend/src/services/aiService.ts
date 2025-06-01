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
  title?: string;
  intents?: string[];
  facility: string;
}

interface FacilityPersonality {
  name: string;
  traits: string[];
}

interface FacilityPersonalities {
  'primary care': FacilityPersonality;
  'urgent care': FacilityPersonality;
  'specialty clinic': FacilityPersonality;
  'emergency room': FacilityPersonality;
  'general': FacilityPersonality;
}

// Add facility detection function
const detectFacility = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Define facility patterns with their variations
  const facilityPatterns = {
    'primary care': ['primary care', 'family doctor', 'general practitioner', 'gp', 'checkup', 'annual exam'],
    'urgent care': ['urgent care', 'walk-in clinic', 'immediate care', 'non-emergency'],
    'specialty clinic': ['specialist', 'specialty', 'cardiology', 'orthopedics', 'pediatrics', 'dermatology'],
    'emergency room': ['emergency', 'er', 'emergency room', 'trauma', 'critical care'],
    'dental': ['dental', 'dentist', 'teeth', 'oral'],
    'ophthalmology': ['eye', 'vision', 'ophthalmology', 'optometry'],
    'physical therapy': ['physical therapy', 'pt', 'rehabilitation', 'rehab'],
    'laboratory': ['lab', 'laboratory', 'blood work', 'testing'],
    'imaging': ['x-ray', 'mri', 'ct scan', 'ultrasound', 'imaging'],
    'pharmacy': ['pharmacy', 'medication', 'prescription', 'drugs']
  };

  for (const [facility, patterns] of Object.entries(facilityPatterns)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return facility;
    }
  }

  return 'general';
};

// Add facility-specific personality traits
const getFacilityPersonality = (facility: string): FacilityPersonality => {
  const personalities: FacilityPersonalities = {
    'primary care': {
      name: 'Primary Care Assistant',
      traits: [
        'I am a Primary Care Assistant with full authority to help you',
        'I have direct access to appointment scheduling and patient records',
        'I can handle routine check-ups, preventive care, and general health concerns',
        'I will never redirect you to another department without proper coordination',
        'I take full responsibility for your healthcare experience',
        'I can provide immediate assistance with appointments, referrals, and general health questions'
      ]
    },
    'urgent care': {
      name: 'Urgent Care Assistant',
      traits: [
        'I am an Urgent Care Assistant with full authority to assist you',
        'I have direct access to urgent care scheduling and patient triage systems',
        'I can handle non-emergency medical concerns and immediate care needs',
        'I will coordinate your care efficiently without unnecessary delays',
        'I take full responsibility for your urgent care experience',
        'I can immediately help with scheduling, wait times, and care coordination'
      ]
    },
    'specialty clinic': {
      name: 'Specialty Clinic Assistant',
      traits: [
        'I am a Specialty Clinic Assistant with full authority to help you',
        'I have direct access to specialist scheduling and referral systems',
        'I can handle specialist appointments, consultations, and follow-ups',
        'I will ensure proper coordination between your primary care and specialists',
        'I take full responsibility for your specialty care experience',
        'I can provide immediate assistance with specialist appointments and care coordination'
      ]
    },
    'emergency room': {
      name: 'Emergency Room Assistant',
      traits: [
        'I am an Emergency Room Assistant with full authority to assist you',
        'I have direct access to emergency triage and patient care systems',
        'I can handle emergency situations and coordinate immediate care',
        'I will ensure you receive prompt attention based on medical priority',
        'I take full responsibility for your emergency care experience',
        'I can provide immediate assistance with emergency care coordination'
      ]
    },
    'general': {
      name: 'Healthcare Assistant',
      traits: [
        'I am a dedicated Healthcare Assistant with full authority to help you',
        'I have direct access to healthcare systems and patient information',
        'I can handle your healthcare needs and concerns directly',
        'I will personally coordinate your care without unnecessary delays',
        'I take full responsibility for your healthcare experience',
        'I am here to provide immediate assistance and care coordination'
      ]
    }
  };

  const facilityKey = facility.toLowerCase() as keyof FacilityPersonalities;
  return personalities[facilityKey] || personalities.general;
};

const SYSTEM_MESSAGE = (facility: string) => {
  const personality = getFacilityPersonality(facility);
  return `You are a Healthcare Assistant for ${personality.name}. ${personality.traits.join('. ')}. 

Key Directives:
1. NEVER suggest contacting other healthcare providers without proper coordination
2. Take FULL responsibility for coordinating patient care
3. ALWAYS ask for specific information needed (patient ID, symptoms, medical history)
4. Offer clear options for care (appointment scheduling, urgent care, emergency services)
5. Use phrases like "I can help you with that right now" and "Let me coordinate your care"
6. Be direct and proactive in offering healthcare solutions
7. Show empathy while maintaining medical professionalism
8. Guide the patient through the healthcare process step by step
9. NEVER say "you'll need to contact" or "you should reach out to" without proper handoff
10. ALWAYS say "I will" or "I can" instead of suggesting external actions
11. Maintain strict patient confidentiality (HIPAA compliance)
12. Prioritize patient safety and well-being
13. Be clear about emergency situations and when to seek immediate care

Response Format:
1. Brief acknowledgment of the healthcare concern
2. Ask for specific information needed (patient ID, symptoms, etc.)
3. Offer clear options for care
4. Confirm next steps and follow-up care

Example:
"I understand you're experiencing chest pain. Could you please provide your patient ID? I can help you schedule an immediate appointment with our cardiology department or coordinate urgent care if needed. Which would you prefer?"

Remember: You ARE the healthcare facility's assistant with full authority to coordinate care. Don't redirect patients without proper handoff - coordinate their care directly.`;
};

const formatMessages = (messages: IMessage[], facility: string) => {
  const formattedMessages = messages.map(message => ({
    role: message.role,
    content: message.content
  }));

  // Add the system message at the start
  formattedMessages.unshift({
    role: 'system',
    content: SYSTEM_MESSAGE(facility)
  });

  return formattedMessages;
};

const analyzeSentiment = async (messages: IMessage[]): Promise<string> => {
  try {
    const conversationText = messages.map(msg => msg.content).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment and urgency of this healthcare conversation. Consider:
1. The overall emotional tone
2. Patient's level of concern or distress
3. Medical urgency of the situation
4. Resolution status of healthcare needs

Respond with EXACTLY one word from these options:
- positive (patient is satisfied, care needs are being met)
- negative (patient is distressed, care needs are not being met)
- urgent (patient needs immediate medical attention)
- neutral (general inquiry or routine care)`
        },
        {
          role: 'user',
          content: conversationText
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    return completion.choices[0].message?.content?.toLowerCase() || 'neutral';
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return 'neutral';
  }
};

const generateTitle = async (messages: IMessage[]): Promise<string> => {
  try {
    const conversationText = messages.map(msg => msg.content).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a short, descriptive title for this healthcare conversation. The title should:
1. Be concise (3-6 words)
2. Capture the main medical concern or service needed
3. Include the facility type if relevant
4. Be written in title case
5. Maintain patient privacy (no specific medical details)

Example formats:
- "Primary Care Appointment Request"
- "Urgent Care Coordination"
- "Specialty Referral Inquiry"
- "Emergency Care Assessment"`
        },
        {
          role: 'user',
          content: conversationText
        }
      ],
      temperature: 0.7,
      max_tokens: 60
    });

    return completion.choices[0].message?.content || 'New Healthcare Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Healthcare Conversation';
  }
};

export const processMessage = async (
  message: string, 
  conversationHistory: IMessage[]
): Promise<AIResponse> => {
  try {
    const startTime = Date.now();
    
    // Create a new message with timestamp
    const newMessage: IMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    // Detect facility from the conversation history and current message
    const allMessages = [...conversationHistory, newMessage];
    const facility = allMessages
      .map(msg => detectFacility(msg.content))
      .find(facility => facility !== 'general') || 'general';
    
    const formattedMessages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    formattedMessages.unshift({
      role: 'system',
      content: SYSTEM_MESSAGE(facility)
    });
    
    formattedMessages.push({
      role: 'user',
      content: message
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 300,
    });
    
    const aiMessage = completion.choices[0].message?.content || 'I apologize, but I couldn\'t process your request.';
    const processingTime = Date.now() - startTime;
    
    // Get sentiment and title
    const sentiment = await analyzeSentiment(allMessages);
    const title = await generateTitle(allMessages);
    const intents = extractIntents(message);
    
    return {
      message: aiMessage,
      processingTime,
      sentiment,
      title,
      intents,
      facility
    };
  } catch (error) {
    console.error('Error in AI service:', error);
    return {
      message: 'I apologize, but I encountered an error processing your request. Please let me know if you\'d like me to try again.',
      processingTime: 0,
      sentiment: 'neutral',
      title: 'New Healthcare Conversation',
      intents: ['error'],
      facility: 'general'
    };
  }
};

const extractIntents = (text: string): string[] => {
  const intents: string[] = [];
  
  if (/\b(how|what|where|when|why|who)\b/i.test(text)) {
    intents.push('question');
  }
  
  if (/\b(help|assist|support)\b/i.test(text)) {
    intents.push('support');
  }
  
  if (/\b(appointment|schedule|book)\b/i.test(text)) {
    intents.push('appointment');
  }
  
  if (/\b(emergency|urgent|immediate)\b/i.test(text)) {
    intents.push('emergency');
  }
  
  if (/\b(pain|symptom|condition|diagnosis)\b/i.test(text)) {
    intents.push('medical');
  }
  
  if (intents.length === 0) {
    intents.push('general');
  }
  
  return intents;
};

const generateProactiveResponse = async (messages: Array<{ role: IMessage['role']; content: string }>, openai: OpenAI) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...messages,
        {
          role: "system",
          content: `You are a healthcare assistant having a natural conversation. Keep these points in mind:
1. Use a warm, empathetic tone while maintaining medical professionalism
2. Respond naturally while being sensitive to healthcare concerns
3. Show genuine care and understanding
4. Use clear, medical-appropriate language
5. Mirror the patient's level of concern appropriately
6. Include appropriate medical acknowledgments
7. Break up longer responses into clear, digestible chunks
8. Use supportive acknowledgments like "I understand", "I hear you", "Let me help"
9. NEVER suggest contacting other providers without proper coordination
10. ALWAYS take direct responsibility for patient care coordination
11. Use "I will" or "I can" instead of suggesting external actions
12. Maintain strict patient confidentiality
13. Be clear about emergency situations

For example, instead of "You'll need to contact the emergency room", say "I can help coordinate your care with the emergency department right now" or "I'll arrange immediate medical attention for you."

Keep the conversation flowing naturally while being genuinely helpful and taking direct responsibility for patient care coordination.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      frequency_penalty: 0.7,
      presence_penalty: 0.6
    });

    return completion.choices[0]?.message?.content || "I'll help coordinate your care right away. What were you saying?";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}; 