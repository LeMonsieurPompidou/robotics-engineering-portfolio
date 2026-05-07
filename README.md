# Robotics Engineering Portfolio - Sam Rahnemayan

This repository contains the source code for my personal portfolio website. It showcases my work as an EPFL Robotics Engineer, focusing on autonomous systems, hardware-software integration, and neuro-robotics.

## 🚀 Live Demo
You can view the live site here: https://lemonsieurpompidou.github.io/portfolio/

## 🛠️ Technical Stack
The website is built using a minimalist and performant approach, focusing on clean code and responsive design without heavy frameworks:
* **HTML5**: Semantic structure for SEO and accessibility.
* **CSS3**: Custom layout using **Flexbox** and **CSS Grid**, featuring a mobile-first responsive design.
* **Vanilla JavaScript**: Interactive elements including a dynamic modal system for project details and smooth navigation.

## 🧠 Featured Projects
The portfolio details several high-level robotics projects, including:
* **Master Thesis**: Neuromuscular Adaptation to Exoskeleton Assistance.
* **Control Systems**: Rocket Drone MPC Controller Design using linear and nonlinear (NMPC) strategies.
* **Embedded Systems**: Instrumented soles development with ESP32 and STM32.
* **Biomechanical Modeling**: Locomotion simulation in Zebrafish and Gait Phase Detection for SCI patients.
* **Autonomous Navigation**: A* algorithm and Kalman Filter implementation for wheeled robots.

## 📂 Project Structure
```text
.
├── index.html    # Main website structure and project data
├── style.css     # Custom styling, CSS variables, and layout
├── script.js     # Modal logic, mobile menu, chatbot, and smooth scrolling
├── README.md     # Project documentation
├── api/
│   └── chat.js       # Vercel serverless function for AI chatbot (Google Gemini)
├── package.json      # Node.js dependencies for Vercel
└── .env.example      # Environment variables template
```

## 💬 AI Chatbot Feature
The portfolio includes an interactive AI chatbot powered by **Google's Gemini API**. The chatbot is context-aware and can answer questions about your background, projects, and experience.

### Chatbot Architecture
- **Frontend**: Vanilla JavaScript with typing animation and markdown rendering
- **Backend**: Vercel serverless function (`api/chat.js`)
- **AI Service**: Google Generative AI (Gemini Pro model)

## 🌐 Deployment on Vercel

### Prerequisites
1. **Google Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

### Deployment Steps
1. Clone or push your repository to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**
3. Select your GitHub repository
4. In the **Environment Variables** section, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from Google AI Studio
5. Deploy! Vercel will automatically detect the serverless function and static files

### Configuration
- The `api/chat.js` function handles POST requests at `/api/chat`
- The frontend sends the system prompt + user message and displays the streamed response
- CORS is configured to allow requests from your portfolio domain

### Local Development
```bash
npm install
npm run dev
```
The development server will run your Vercel functions locally at `http://localhost:3000/api/chat`