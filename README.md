# Adaptive AI Tutor

A personalized AI tutoring platform that maintains a persistent student model to adapt explanations, track mastery, identify recurring mistakes, and deliver genuinely personalized learning experiences.

## What makes this different

Most AI tutors are chat wrappers. This one builds a **student model** — a structured representation of what you know, how you learn, and where you struggle. Every response is shaped by your profile, mastery scores, mistake history, and session context.

### Core capabilities

- **Structured onboarding** — 4-step profiling captures grade level, subjects, goals, learning preferences, and interests
- **Adaptive tutoring** — Gemini 2.5 Flash generates responses using a system prompt assembled from the full student context
- **Mastery tracking** — Weighted moving average scoring (70% historical, 30% recent) with confidence levels that grow with attempts
- **Mistake extraction** — LLM analyzes session transcripts to identify and track recurring error patterns
- **Session summaries** — Structured summaries capture topics covered, understood concepts, struggles, and review recommendations
- **Progress dashboard** — Visual mastery bars, mistake patterns, study recommendations, and session history

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 (prisma-client generator + @prisma/adapter-pg) |
| Auth | NextAuth v5 (JWT + Credentials) |
| AI | Gemini 2.5 Flash via @google/genai |
| Validation | Zod 4 |

## Architecture

```
UI Layer (React)          API Layer (Route Handlers)
  |                         |
  Login/Register            /api/auth/*
  Onboarding (4 steps)      /api/onboarding
  Chat                      /api/chat
  Dashboard                 /api/dashboard
                            /api/sessions/summarize
                              |
                    Tutor Orchestration
                     /          |          \
              Prompt         Gemini       Student
              Builder        Client       Model
                 |              |            |
              Student        2.5 Flash    Mastery +
              Context                     Mistakes
                 \              |            /
                  --------  Prisma  --------
                              |
                          PostgreSQL
```

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/adaptive-ai-tutor.git
cd adaptive-ai-tutor

# Install
npm install

# Environment
cp .env.example .env
# Edit .env with your database URL, auth secret, and Gemini API key

# Generate auth secret
npx auth secret

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

Create a PostgreSQL database:

```sql
CREATE DATABASE adaptive_tutor;
```

Update `DATABASE_URL` in `.env` with your credentials.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth encryption secret (generate with `npx auth secret`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |

## How personalization works

1. **Onboarding** collects grade, subjects, goals, interests, explanation style preferences
2. **Prompt builder** assembles a system prompt from the full student context:
   - Profile data (grade, subjects, goals)
   - Style preferences mapped to behavioral instructions
   - Top 15 mastery scores sorted by performance
   - Top 10 active mistake patterns with frequency
   - Last 3 session summaries with struggle areas
3. **Gemini** receives this context-rich prompt + conversation history
4. **After each session**, the LLM generates:
   - Structured summary (topics, understood, struggled, review next)
   - Extracted mistakes (subject, topic, type, description)
5. **Mastery scores** update via weighted moving average
6. **Dashboard** surfaces all of this for the student

## Database schema

9 models: User, Account, Session, VerificationToken, StudentProfile, SubjectMastery, MistakePattern, TutorSession, SessionMessage.

Key relationships:
- User -> StudentProfile (1:1)
- StudentProfile -> SubjectMastery (1:many, unique on [profile, subject, topic])
- StudentProfile -> MistakePattern (1:many)
- User -> TutorSession (1:many) -> SessionMessage (1:many)

## Project structure

```
src/
  app/
    page.tsx                    # Landing page
    login/page.tsx              # Login form
    register/page.tsx           # Registration form
    onboarding/page.tsx         # 4-step profiling
    chat/page.tsx               # Tutor chat interface
    dashboard/page.tsx          # Progress dashboard
    api/
      auth/[...nextauth]/       # NextAuth handlers
      auth/register/            # User registration
      onboarding/               # Profile save/load
      chat/                     # Chat with context
      dashboard/                # Aggregated stats
      sessions/summarize/       # Session summary + mistake extraction
  lib/
    db.ts                       # Prisma client singleton
    auth.ts                     # NextAuth config
    auth-types.ts               # Session type augmentation
    utils.ts                    # cn() utility
    tutor/
      gemini.ts                 # Gemini API client
      prompt-builder.ts         # Context-aware prompt assembly
      student-model.ts          # Mastery + mistake tracking
  proxy.ts                      # Auth middleware (Next.js 16 proxy)
prisma/
  schema.prisma                 # Database schema
```

## Deployment

### Vercel

```bash
npm run build  # Verify build passes
vercel deploy
```

Set all environment variables in the Vercel dashboard. Use a managed PostgreSQL provider (Supabase, Neon, etc.).

## What's implemented (MVP)

- [x] Email/password authentication with JWT
- [x] 4-step structured onboarding
- [x] Context-aware AI chat with Gemini 2.5 Flash
- [x] Prompt assembly from full student model
- [x] Mastery tracking with weighted moving average
- [x] Mistake extraction and pattern tracking
- [x] Session summarization
- [x] Progress dashboard with mastery bars and recommendations
- [x] Auth proxy protecting routes
- [x] Zod validation on all API inputs

## What's next

- [ ] OAuth providers (Google, GitHub)
- [ ] Spaced repetition scheduling
- [ ] Quiz/assessment mode
- [ ] Multi-modal support (image upload for math problems)
- [ ] Export progress reports
- [ ] Mobile-responsive improvements
- [ ] Rate limiting on API routes
