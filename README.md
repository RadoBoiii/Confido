# ConversAI - AI-Powered Conversation Simulator

A full-stack application that simulates AI-powered conversations with company-specific support agents.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v8.0.6 or higher)
- npm or yarn

## Setup Instructions

### 1. Start MongoDB

```bash
# Start MongoDB server (if not already running)
mongod --dbpath /path/to/your/data/directory

# Verify MongoDB is running
ps aux | grep mongod
```

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ConversAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

#### Backend (.env)
Create a `.env` file in the backend directory with:
```
MONGODB_URI=mongodb://localhost:27017/conversai
PORT=5001
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
```

#### Frontend (.env)
Create a `.env` file in the frontend directory with:
```
REACT_APP_SOCKET_URL=http://localhost:5001
```

### 4. Start the Application

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend Development Server
```bash
cd frontend
npm start
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB is running: `ps aux | grep mongod`
   - Check MongoDB logs for errors
   - Verify the MongoDB URI in your .env file

2. **Port Already in Use**
   - If you see `EADDRINUSE: address already in use :::5001`
   - Kill the process using port 5001:
     ```bash
     lsof -i :5001
     kill -9 <PID>
     ```

3. **TypeScript Errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are properly installed

4. **Socket.io Connection Issues**
   - Check if both frontend and backend servers are running
   - Verify the socket URL in frontend .env file
   - Check CORS settings in backend

## Development

### Project Structure

```
ConversAI/
├── backend/
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Server entry point
│   ├── public/            # Static files
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── contexts/      # React contexts
    │   └── App.tsx        # Main application
    └── package.json
```

### Available Scripts

#### Backend
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript files
- `npm start`: Start production server

#### Frontend
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## Features

- Real-time conversation simulation
- Company-specific AI agents (Netflix, Amazon, Pizza Hut, Apple)
- Audio message support
- Sentiment analysis
- Automatic conversation titling
- Conversation history and management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT and Text-to-Speech APIs
- The React and Node.js communities for excellent documentation and tools 
