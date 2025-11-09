# HiREady - AI-Powered Interview Preparation Platform

HiREady is a comprehensive interview preparation platform that combines AI-powered resume analysis, interactive voice interviews, and detailed performance reports to help candidates succeed in their job search.

## 🚀 Project Info

**URL**: https://lovable.dev/projects/d836bc1d-4988-4904-a40a-2af9ac2801e5

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Development](#development)

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching

### Backend (Lovable Cloud)
- **Supabase** for database, authentication, and storage
- **Edge Functions** (serverless) for API endpoints
- **PostgreSQL** database with Row Level Security (RLS)

### AI Services
- **Google Gemini 2.5 Flash** (via Lovable AI Gateway) - Primary AI model for analysis and conversations
- **OpenAI Whisper** - Speech-to-text transcription
- **OpenAI TTS** - Text-to-speech generation

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- A Lovable account with Cloud enabled

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The following environment variables are automatically configured via Lovable Cloud:

```env
VITE_SUPABASE_URL=<auto-configured>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
VITE_SUPABASE_PROJECT_ID=<auto-configured>
```

Backend secrets (configured in Lovable Cloud):
- `LOVABLE_API_KEY` - Auto-configured for AI Gateway
- `OPENAI_API_KEY` - Required for speech services

## 📊 Database Schema

### Tables

#### `profiles`
Stores user profile information.

```sql
{
  id: uuid (primary key, references auth.users)
  full_name: text
  email: text
  created_at: timestamp
  updated_at: timestamp
}
```

**RLS Policies:**
- Users can view, insert, and update their own profile

#### `resumes`
Stores uploaded resumes and analysis results.

```sql
{
  id: uuid (primary key)
  user_id: uuid (references auth.users)
  file_name: text
  file_url: text
  extracted_text: text
  target_role: text
  experience_level: text
  analysis_result: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

**RLS Policies:**
- Users can view, insert, update, and delete their own resumes

#### `interviews`
Stores interview sessions and transcripts.

```sql
{
  id: uuid (primary key)
  user_id: uuid (references auth.users)
  resume_id: uuid (references resumes)
  transcript: jsonb
  status: text (default: 'in_progress')
  analysis_result: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

**RLS Policies:**
- Users can view, insert, update, and delete their own interviews

### Storage Buckets

#### `resumes`
- **Public**: No
- **Purpose**: Store uploaded resume files (PDF, DOC, DOCX, images)
- **Access**: Private, user-specific via RLS

## 🔌 API Documentation

All API endpoints are serverless edge functions deployed automatically. They use JWT authentication and are accessible via the Supabase client.

### Base URL
```
https://rxkntgrccfqhaoongyzo.supabase.co/functions/v1
```

### Authentication
All endpoints require authentication. Include the user's session token in requests:

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('endpoint-name', {
  body: { /* your data */ }
});
```

---

### 1. Resume Upload

**Endpoint:** `POST /resume-upload`

**Description:** Upload a resume file, extract text, and store in database and storage.

**Request Format:**
```typescript
// FormData with fields:
{
  file: File,              // Resume file (PDF, DOC, DOCX, JPG, PNG)
  targetRole: string,      // Target job role
  experienceLevel: string  // Experience level (entry, mid, senior)
}
```

**Frontend Example:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('targetRole', 'Software Engineer');
formData.append('experienceLevel', 'mid');

const { data, error } = await supabase.functions.invoke('resume-upload', {
  body: formData
});
```

**Response:**
```typescript
{
  success: true,
  resumeId: "uuid",
  extractedText: "extracted resume content..."
}
```

**Error Responses:**
- `400` - No file provided
- `401` - Unauthorized
- `500` - Upload or processing failed

---

### 2. Resume Analysis

**Endpoint:** `POST /analyze-resume`

**Description:** Analyze resume using AI and generate comprehensive feedback.

**Request:**
```typescript
{
  resumeId: string,         // Resume ID from database
  extractedText: string,    // Resume text content
  targetRole: string,       // Target job role
  experienceLevel: string   // Experience level
}
```

**Frontend Example:**
```typescript
const { data, error } = await supabase.functions.invoke('analyze-resume', {
  body: {
    resumeId: resume.id,
    extractedText: resume.extracted_text,
    targetRole: resume.target_role,
    experienceLevel: resume.experience_level
  }
});
```

**Response:**
```typescript
{
  success: true,
  analysis: {
    overallScore: number,        // 0-100
    atsScore: number,            // 0-100
    keywordsScore: number,       // 0-100
    formatScore: number,         // 0-100
    skills: string[],            // Identified skills
    strengths: string[],         // Resume strengths
    improvements: string[],      // Areas to improve
    recommendations: string[],   // Specific recommendations
    interviewQuestions: string[], // Suggested questions
    skillsDistribution: {        // Skills by category
      technical: number,
      soft: number,
      domain: number
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - AI analysis failed

---

### 3. Speech to Text

**Endpoint:** `POST /speech-to-text`

**Description:** Convert audio recording to text using OpenAI Whisper.

**Request:**
```typescript
{
  audio: string  // Base64-encoded audio data (webm format)
}
```

**Frontend Example:**
```typescript
const { data, error } = await supabase.functions.invoke('speech-to-text', {
  body: {
    audio: base64AudioString
  }
});
```

**Response:**
```typescript
{
  text: string  // Transcribed text
}
```

**Error Responses:**
- `400` - No audio data provided
- `401` - Unauthorized
- `500` - Transcription failed

---

### 4. Text to Speech

**Endpoint:** `POST /text-to-speech`

**Description:** Convert text to speech audio using OpenAI TTS.

**Request:**
```typescript
{
  text: string,           // Text to convert
  voice?: string          // Voice option (default: 'alloy')
}
```

**Available Voices:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

**Frontend Example:**
```typescript
const { data, error } = await supabase.functions.invoke('text-to-speech', {
  body: {
    text: 'Hello, welcome to your interview.',
    voice: 'alloy'
  }
});
```

**Response:**
```typescript
{
  audioContent: string  // Base64-encoded MP3 audio
}
```

**Playback Example:**
```typescript
const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
audio.play();
```

**Error Responses:**
- `400` - No text provided
- `401` - Unauthorized
- `500` - Speech generation failed

---

### 5. Interview Chat

**Endpoint:** `POST /interview-chat`

**Description:** AI-powered interview conversation with context from resume.

**Request:**
```typescript
{
  messages: Array<{        // Conversation history
    role: 'user' | 'assistant',
    content: string
  }>,
  resumeId?: string,       // Optional resume context
  interviewId: string      // Interview session ID
}
```

**Frontend Example:**
```typescript
const { data, error } = await supabase.functions.invoke('interview-chat', {
  body: {
    messages: [
      { role: 'user', content: 'Tell me about yourself.' }
    ],
    resumeId: resume.id,
    interviewId: interview.id
  }
});
```

**Response:**
```typescript
{
  message: string  // AI interviewer response
}
```

**Features:**
- Context-aware based on resume and target role
- Maintains conversation history in database
- Professional interview style with follow-up questions

**Error Responses:**
- `401` - Unauthorized
- `500` - AI chat failed

---

### 6. Generate Report

**Endpoint:** `POST /generate-report`

**Description:** Generate comprehensive interview performance report.

**Request:**
```typescript
{
  interviewId: string  // Interview session ID
}
```

**Frontend Example:**
```typescript
const { data, error } = await supabase.functions.invoke('generate-report', {
  body: {
    interviewId: interview.id
  }
});
```

**Response:**
```typescript
{
  success: true,
  report: {
    overallScore: number,           // 0-100
    communicationScore: number,     // 0-100
    technicalScore: number,         // 0-100
    problemSolvingScore: number,    // 0-100
    confidenceLevel: string,        // 'Low' | 'Medium' | 'High'
    strengths: string[],            // Key strengths
    improvements: string[],         // Areas to improve
    feedback: string[],             // Specific feedback items
    recommendations: string[],      // Recommendations
    hiringRecommendation: string    // 'Strong Yes' | 'Yes' | 'Maybe' | 'No'
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Interview not found
- `500` - Report generation failed

---

## 🔐 Authentication

### Setup

The project uses Supabase Authentication with email/password and Google OAuth.

### Email/Password Authentication

**Sign Up:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: `${window.location.origin}/`,
    data: {
      full_name: 'John Doe'
    }
  }
});
```

**Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});
```

**Sign Out:**
```typescript
const { error } = await supabase.auth.signOut();
```

### Google OAuth

**Configuration Required:**
1. Set up Google OAuth in Lovable Cloud dashboard
2. Configure redirect URLs in Google Cloud Console

**Sign In with Google:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`
  }
});
```

### Session Management

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user };
}
```

## 🚀 Deployment

### Frontend Deployment

**Via Lovable:**
1. Open your project in Lovable
2. Click the **Publish** button (top right on desktop)
3. Click **Update** to deploy frontend changes

**Important:** Frontend changes require clicking "Update" to go live, while backend changes (edge functions, database) deploy automatically.

### Custom Domain

1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow DNS configuration instructions
4. Note: Requires a paid Lovable plan

**Learn more:** [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain)

## 💻 Development

### Edit Code

**Option 1: Use Lovable** (Recommended)
- Visit [Lovable Project](https://lovable.dev/projects/d836bc1d-4988-4904-a40a-2af9ac2801e5)
- Chat with AI to make changes
- Changes commit automatically

**Option 2: Local IDE**
- Clone repo and make changes locally
- Push to GitHub - syncs with Lovable automatically

**Option 3: GitHub Codespaces**
- Click "Code" → "Codespaces" → "New codespace"
- Edit and commit directly in browser

### Testing Edge Functions Locally

Edge functions are deployed automatically and can be tested via the Supabase client. For local development:

```typescript
// Test in your React app
const testFunction = async () => {
  const { data, error } = await supabase.functions.invoke('function-name', {
    body: { test: 'data' }
  });
  console.log({ data, error });
};
```

### Database Management

Access your database via Lovable Cloud dashboard:
1. Click **Cloud** tab in Lovable
2. Navigate to **Database** → **Tables**
3. View, edit, and export data

## 📚 Additional Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Lovable AI Features](https://docs.lovable.dev/features/ai)
- [Lovable Cloud Features](https://docs.lovable.dev/features/cloud)

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors:**
- Ensure redirect URLs are configured correctly
- Check that email confirmation is disabled for testing

**Edge Function Errors:**
- Check function logs in Lovable Cloud dashboard
- Verify all required secrets are configured
- Ensure request format matches documentation

**Upload Issues:**
- Verify file size is under limits
- Check storage bucket permissions
- Ensure RLS policies are correct

### Getting Help

- [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Lovable Support](https://docs.lovable.dev/)

## 📝 License

This project is built with Lovable and uses various open-source technologies.
