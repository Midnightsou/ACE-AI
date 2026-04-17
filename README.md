# ACE AI

A comprehensive AI-powered learning and productivity platform. ACE AI provides intelligent tutoring, content creation, and professional development tools powered by DeepSeek AI.

## ✨ Features

### Core Features
- **Ace AI** - General-purpose AI assistant for learning and Q&A
- **Axioma** - Advanced math problem solver with visualization support
- **Fabricare** - Code writing and debugging assistant
- **Omnis** - Interactive learning tool with chat, summaries, quizzes, and podcast generation

### Productivity Tools
- **Aeterna** - Professional CV/Resume generation
- **Kairos** - CV optimization based on job descriptions
- **Peitho** - Tailored cover letter writing
- **Scribe** - Academic and professional essay writing
- **Litterae** - Professional email composition

### Advanced Capabilities
- Real-time streaming responses
- Multi- nigeria language support (English, Hausa, Yoruba, Pidgin)
- Conversation history and persistence
- File upload and text extraction (OCR, PDF parsing)
- Math visualization with KaTeX and Plotly
- Audio generation
- Web search and content extraction

## 🛠 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Tailwind CSS 4** - Styling
- **Zustand** - State management

### Backend Services
- **Firebase** - Authentication and Firestore database
- **DeepSeek AI** - LLM API for chat and content generation
  - DeepSeek-R1-0528 for math-heavy queries
  - DeepSeek-V3.2 for general queries

### Libraries & Tools
- **Axios** - HTTP client
- **KaTeX** - Math equation rendering
- **Plotly.js** - Data visualization
- **PDF.js** - PDF document parsing
- **Mammoth** - DOCX file parsing
- **ESLint** - Code linting

## 📁 Project Structure

```
my-grim-tutor/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── chat/           # Chat interface components
│   │   ├── sidebar/        # Navigation sidebar
│   │   ├── tools/          # Tool-specific UI components
│   │   ├── onboarding/     # User onboarding flow
│   │   └── ui/             # Basic UI components
│   ├── pages/              # Page-level components
│   │   ├── ChatPage.jsx    # Main chat interface
│   │   ├── ToolsPage.jsx   # Tools discovery
│   │   ├── ToolPage.jsx    # Individual tool pages
│   │   ├── LoginPage.jsx   # Authentication
│   │   └── ProfilePage.jsx # User profile
│   ├── hooks/              # Custom React hooks
│   │   ├── useChat.js      # Chat management
│   │   ├── useAuth.js      # Authentication
│   │   ├── useTool.js      # Tool-specific logic
│   │   └── ...
│   ├── services/           # API and external service integrations
│   │   ├── firebase.js     # Firebase configuration
│   │   ├── deepseek.js     # DeepSeek API client
│   │   ├── memory.js       # Database operations
│   │   ├── ocr.js          # Image text extraction
│   │   ├── pdf.js          # PDF parsing
│   │   ├── podcast.js      # Audio generation
│   │   └── ...
│   ├── store/              # Zustand state stores
│   │   ├── chatStore.js
│   │   ├── userStore.js
│   │   ├── toolStore.js
│   │   └── ...
│   ├── prompts/            # AI system prompts
│   │   ├── systemPrompt.js
│   │   ├── hausaPrompt.js
│   │   ├── yorubaPrompt.js
│   │   └── tools/          # Tool-specific prompts
│   ├── tools/
│   │   ├── registry.js     # Tool definitions and metadata
│   │   └── cvStyles.js     # CV styling options
│   └── utils/              # Utility functions
├── server/                 # Backend routes and controllers
│   ├── routes/
│   ├── controllers/
│   └── middleware/
├── public/                 # Static assets
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── eslint.config.js       # ESLint configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Firebase account
- DeepSeek API key
- ElevenLabs API key (for podcast feature)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/my-grim-tutor.git
   cd my-grim-tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 📝 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint
```

## 🎯 Available Tools

| Tool | ID | Description | Icon |
|------|----|----|------|
| Ace AI | `chat` | General AI assistant | 💬 |
| Axioma | `math` | Math problem solver | 🧮 |
| Fabricare | `codex` | Code writing & debugging | 🔧 |
| Aeterna | `cv-maker` | CV generation | 📄 |
| Kairos | `cv-analyser` | CV optimization | 🔍 |
| Peitho | `cover-letter` | Cover letter writing | ✉️ |
| Scribe | `essay-writer` | Essay writing | 📑 |
| Litterae | `email-composer` | Email writing | 📨 |
| Omnis | `dojo` | Interactive learning | 🥋 |

## 🔐 Authentication

The app uses Firebase Authentication with:
- Email/password authentication
- Google Sign-In integration
- Session management with Zustand state store
- Protected routes with user onboarding flow

## 💾 Data Persistence

- **Firebase Firestore** for user profiles, conversations, and message history
- **Session storage** for UI state (splash screen)
- **Zustand stores** for client-side state management

## 🌍 Multi-language Support

The app supports multiple nigerian languages through configurable prompts:
- English
- Hausa
- Yoruba
- Pidgin

Language is managed through user preferences in their profile.

## 🎨 Styling

- **Tailwind CSS v4** for utility-first styling
- Custom CSS modules for component-specific styles
- Responsive design with mobile-first approach
- Support for dark/light themes (via Tailwind)



## 🔌 AI Model Routing

The app intelligently routes queries to different DeepSeek models:
- **DeepSeek-R1-0528** - For math-heavy queries (contains keywords like "solve", "integrate", "derivative", etc.)
- **DeepSeek-V3.2** - For general queries

Math detection keywords: `solve`, `calculate`, `integral`, `derivative`, `equation`, `algebra`, `matrix`, `quadratic`, `differentiate`, `integrate`, `prove`, `simplify`, `factorise`, `factorize`, `graph`, `plot`

## 🌐 External Integrations

- **Firebase Authorization** - User authentication
- **Firestore** - Real-time database
- **DeepSeek API** - AI chat and content generation
- **ElevenLabs** - Text-to-speech audio generation
- **Web Search APIs** - Content discovery
- **URL Fetching** - Content extraction from web pages

## 📦 Build & Deployment

The project is configured for production with:
- Vite production build optimization
- ESLint configuration for code quality
- Tailwind CSS purging unused styles
- Environment-based configuration

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙋 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the feature request template

## 🎓 About

ACE AI is designed to make learning and content creation more accessible through AI-powered tools. Whether you're a student looking to solve math problems, a professional writing resumes, or anyone seeking to learn, ACE AI has a tool for you.

---

AUTHOR ----- EMIOLA MUKHTAR 
