# NursaAI System Design Document

## Architecture Overview

NursaAI is a full-stack application that simulates AI-powered conversations with healthcare support agents. The system architecture consists of the following key components:

1. **Frontend (React + TypeScript)**
   - User interface for agent creation and management
   - Real-time conversation interface
   - Audio playback system
   - WebSocket client for real-time communication

2. **Backend (Node.js + Express + TypeScript)**
   - RESTful API endpoints for agent and conversation management
   - WebSocket server for real-time communication
   - MongoDB database integration
   - OpenAI API integration for LLM and TTS

3. **AI Components**
   - Large Language Model (GPT-3.5 Turbo) for conversation generation
   - Text-to-Speech (OpenAI TTS) for voice synthesis
   - Custom prompt engineering for healthcare-specific responses

## Tech Stack & Tools

### Frontend
- **React + TypeScript**: For type-safe, component-based UI development
- **Tailwind CSS**: For modern, responsive styling
- **Socket.io-client**: For real-time communication
- **Axios**: For HTTP requests
- **React Router**: For client-side routing

### Backend
- **Node.js + Express**: For server-side application
- **TypeScript**: For type safety and better development experience
- **MongoDB**: For data persistence
- **Socket.io**: For real-time bidirectional communication
- **OpenAI API**: For LLM and TTS capabilities

### AI & ML
- **GPT-3.5 Turbo**: Chosen for its balance of performance and cost
- **OpenAI TTS**: Selected for high-quality voice synthesis
- **Custom Prompt Engineering**: For healthcare-specific responses

## Prompt Engineering

### System Prompt Strategy
The system uses a multi-layered prompt engineering approach:

1. **Base System Prompt**
```typescript
You are an AI Customer Service Representative for [Company]. [Personality Traits]

Key Directives:
1. NEVER suggest contacting other support channels
2. Take FULL responsibility for resolving issues
3. ALWAYS ask for specific information needed
4. Offer clear options for resolution
5. Use proactive language ("I can help you with that right now")
```

2. **Healthcare-Specific Prompts**
```typescript
- Always maintain a professional yet warm and empathetic tone
- Be patient and understanding with callers who may be anxious
- Ask clear, specific questions to gather necessary information
- Provide step-by-step guidance for appointments
- Show empathy for patients' health concerns
- Maintain patient confidentiality and privacy
```

### Conversation Flow Control
- Structured conversation flow with clear stages:
  1. Greeting & Intake
  2. Information Gathering
  3. Processing
  4. Confirmation
  5. Closing

## Assumptions & Limitations

### Current Assumptions
1. Single-speaker input (no multi-party conversations)
2. English language only
3. Standard audio input/output capabilities
4. Stable internet connection for real-time communication
5. Basic healthcare terminology understanding

### Current Limitations
1. No support for multiple concurrent calls
2. Limited to English language
3. No integration with actual healthcare systems
4. No real-time calendar integration
5. No support for emergency situations
6. No handling of overlapping speech
7. Limited to text-based input (no voice input)

### Future Improvements
1. **Technical Enhancements**
   - Implement voice input using STT
   - Add support for multiple concurrent calls
   - Integrate with real healthcare systems
   - Add real-time calendar integration
   - Implement multi-language support

2. **Healthcare-Specific Features**
   - HIPAA compliance implementation
   - Emergency protocol handling
   - Integration with medical records systems
   - Support for medical terminology
   - Appointment scheduling system integration

3. **Security & Compliance**
   - End-to-end encryption
   - HIPAA compliance measures
   - Audit logging
   - Data retention policies
   - Access control mechanisms

4. **Scalability**
   - Load balancing for concurrent calls
   - Database sharding
   - Caching layer
   - CDN integration for static assets
   - Microservices architecture

## Error Handling & Edge Cases

The system includes robust error handling for:
1. Network connectivity issues
2. API rate limiting
3. Invalid user inputs
4. Database connection failures
5. Audio processing errors
6. Conversation state management
7. WebSocket disconnections

## Performance Considerations

1. **Optimization Strategies**
   - Caching of frequently used data
   - Efficient database queries
   - Optimized audio file handling
   - WebSocket connection management
   - Frontend performance optimization

2. **Monitoring & Logging**
   - Real-time performance monitoring
   - Error tracking and logging
   - Usage analytics
   - System health checks
   - Resource utilization tracking 