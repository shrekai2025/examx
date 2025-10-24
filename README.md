# English Learning App

A T3 Stack application for learning English vocabulary with a reward system.

## Tech Stack

- **Next.js 15** - React framework
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - Database ORM with SQLite
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **iron-session** - Simple session management

## Features

### Admin Portal (`/admin`)

- **Vocabulary Management**: Add, edit, delete vocabulary items with images, audio, and notes
- **Target Vocabulary Selection**: Choose specific vocabularies for student learning
- **System Configuration**:
  - Set points per question
  - Configure points-to-reward ratio
  - Set maximum rewards per cycle
  - Initialize settlement cycle (monthly reset)

### Student Portal (`/app`)

- **Interactive Learning**: Answer questions and earn points
- **Two Question Types**:
  - Image to Word: View an image, select the correct word from 3 options
  - Word to Image: See a word, select the correct image from 3 options
- **Reward System**: Points convert to rewards based on admin settings
- **Point History**: View detailed point change logs
- **Session Continuity**: Resume from where you left off

## Getting Started

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

The [.env](.env) file is already configured with default credentials:

\`\`\`env
# Database
DATABASE_URL="file:./db.sqlite"

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Student Credentials
USER_USERNAME=user
USER_PASSWORD=user123

# Session Secret
SESSION_SECRET=your-secret-key-change-this-in-production-min-32-chars
\`\`\`

### 3. Setup Database

\`\`\`bash
npm run db:push
\`\`\`

### 4. Add Required Audio File

Place a file named `Q1.mp3` in the [public/](public/) directory. This audio plays when showing image-to-word questions.

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Admin Setup

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Login with:
   - Username: `admin`
   - Password: `admin123`

3. **Add Vocabularies**:
   - Go to "Vocabularies" page
   - Click "Add New"
   - Fill in word, upload image and audio (optional), add notes
   - Click "Create"

4. **Select Target Vocabularies**:
   - Go to "Target Vocabularies" page
   - Click "Add" on vocabularies you want students to learn
   - Students will only see questions from target vocabularies

5. **Configure Settings**:
   - Go to "Settings" page
   - Set points per question (default: 1)
   - Set points to reward ratio (default: 1.0, meaning 1 point = 1 reward unit)
   - Set max reward per cycle (default: 100.0)
   - Initialize settlement cycle (choose a day of month, can only be set once)

### Student Learning

1. Go to [http://localhost:3000/app/login](http://localhost:3000/app/login)
2. Login with:
   - Username: `user`
   - Password: `user123`

3. Click "Start Earning" to begin learning
4. Answer questions:
   - Correct answer: +1 point (configurable)
   - Wrong answer: -1 point (configurable)
5. View your points and rewards in real-time
6. Click "History" to see detailed point change logs
7. Click "Stop Learning" to pause (you'll resume from the same question)

## Key Features Explained

### Question Types

1. **Image to Word**:
   - Shows an image
   - Plays Q1.mp3 audio
   - Student selects the correct word from 3 options

2. **Word to Image**:
   - Shows a word
   - Plays the word's audio (if available)
   - Student selects the correct image from 3 options

### Reward System

- Points are earned by answering correctly, lost by answering incorrectly
- Points can be negative
- Rewards = Points × Reward Ratio (capped at maximum per cycle)
- Rewards are always ≥ 0 (even if points are negative)

### Settlement Cycle

- Admin sets a monthly settlement day (1-31)
- On that day each month, the system:
  - Saves current points and rewards to history
  - Resets points and rewards to 0
  - Continues tracking for the new cycle

### Session Continuity

- When a student stops learning, the current question is saved
- Next time they start learning, they continue with the same question
- This ensures no questions are skipped

## File Upload

- Maximum file size: 100MB per file
- Supported formats: Any image or audio format
- Files are stored in [public/uploads/](public/uploads/)

## Database Schema

- **Vocabulary**: All vocabulary items with images, audio, and notes
- **TargetVocabulary**: Selected vocabularies for student learning
- **SystemConfig**: Global settings (points, rewards, settlement)
- **UserState**: Current student state (points, rewards, current question)
- **PointLog**: Detailed history of point changes
- **SettlementHistory**: Historical records of each settlement cycle

## Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio (database GUI)
\`\`\`

## Project Structure

\`\`\`
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin portal pages
│   ├── app/               # Student portal pages
│   └── api/               # API routes (tRPC, upload, cron)
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── session.ts        # Authentication logic
│   ├── settlement.ts     # Auto-settlement logic
│   └── trpc/             # tRPC client/server setup
├── server/                # Backend code
│   ├── api/              # tRPC routers
│   ├── db.ts             # Prisma client
│   └── trpc.ts           # tRPC configuration
prisma/
└── schema.prisma          # Database schema
\`\`\`

## Security Notes

⚠️ **This is a simple implementation for local/educational use**:

- Credentials are stored in plain text in [.env](.env)
- Session secret should be changed for production
- No rate limiting or advanced security features
- Not recommended for public deployment without additional security measures

## License

ISC
