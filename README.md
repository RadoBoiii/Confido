# ConversAI - Interactive Voice Chat Application

ConversAI is a modern web application that enables natural voice conversations with an AI assistant. It features real-time speech recognition, text-to-speech responses, and a clean, intuitive interface.

## Features

- 🎙️ Real-time voice recording and transcription
- 🤖 AI-powered conversational responses
- 🔊 Text-to-speech for AI responses
- 💬 Text chat interface with typing indicators
- 🎯 Clean and modern UI built with React and Tailwind CSS
- 🔒 User authentication system
- 📝 Conversation history tracking

## Tech Stack

- **Frontend:**
  - React with TypeScript
  - Tailwind CSS for styling
  - Socket.io client for real-time communication
  - Web Speech API for voice recognition

- **Backend:**
  - Node.js with Express
  - MongoDB for data storage
  - Socket.io for real-time events
  - OpenAI API for AI responses
  - Text-to-speech conversion

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenAI API key

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RadoBoiii/ConverseAI.git
   cd ConverseAI
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/conversai
   FRONTEND_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start MongoDB:**
   ```bash
   # Create data directory
   mkdir -p backend/data/db
   
   # Start MongoDB
   mongod --dbpath backend/data/db
   ```

5. **Start the application:**
   ```bash
   # Start backend (in backend directory)
   npm run dev

   # Start frontend (in frontend directory)
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Open the Call Simulator page
2. Click the microphone icon to start recording
3. Speak your message
4. Click the stop icon to send your message
5. Wait for the AI response (both text and audio)

## Project Structure

```
converseai/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   └── index.ts
│   ├── public/
│   │   └── audio/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT and Text-to-Speech APIs
- The React and Node.js communities for excellent documentation and tools 