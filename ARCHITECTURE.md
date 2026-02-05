# Empathy Link - Project Architecture

This document provides an overview of where to find different parts of the codebase across the three main projects.

## Project Structure

### 1. **empathy-link-expo** (Mobile App - React Native/Expo)
Location: `/Users/alexanderbuckner/+Code/empathy-link-expo/`

```
empathy-link-expo/
├── app/                          # Expo Router - file-based routing
│   ├── (auth)/                   # Auth group - login/signup screens
│   │   ├── _layout.tsx          # Auth layout with redirect logic
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   ├── (protected)/             # Protected routes - require authentication
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── _layout.tsx     # Tab bar configuration
│   │   │   ├── index.tsx       # Home/Chat tab
│   │   │   ├── community.tsx   # Community tab
│   │   │   ├── learn.tsx       # Learn tab
│   │   │   └── stats.tsx       # Stats tab
│   │   ├── _layout.tsx         # Protected layout with auth guard
│   │   └── modal.tsx           # Example modal
│   └── _layout.tsx              # Root layout (providers, themes)
│
├── components/                   # Reusable React components
│   ├── stats/                   # Stats page components
│   │   ├── DonutChart.tsx      # SVG donut chart
│   │   ├── StatsChatOverview.tsx
│   │   ├── StatsFeelings.tsx
│   │   ├── StatsNeeds.tsx
│   │   ├── StatsMemories.tsx
│   │   └── StatsInsights.tsx
│   └── Header.tsx               # Main header component
│
├── hooks/                        # Custom React hooks
│   └── use-auth.ts              # Auth context and hooks
│
├── lib/                          # Libraries and utilities
│   ├── auth.ts                  # Better Auth client config
│   └── i18n.ts                  # Internationalization setup
│
├── messages/                     # Translation files
│   ├── de.json                  # German translations
│   └── en.json                  # English translations
│
├── baseColors.config.js         # Color theme configuration
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

#### Key Files:
- **API Client**: `lib/auth.ts` - Base URL: `http://localhost:4000`
- **Auth Hooks**: `hooks/use-auth.ts` - `useAuth()`, `useAuthProvider()`, `useAuthGuard()`
- **Routes**: All routes are file-based in `app/` directory
- **Styling**: Uses NativeWind (Tailwind for React Native) + StyleSheet

---

### 2. **empathy-link-backend** (API Server - Hono/Node.js)
Location: `/Users/alexanderbuckner/+Code/empathy-link-backend/`

```
empathy-link-backend/
├── src/
│   ├── routes/                  # API route handlers
│   │   ├── stats.ts            # GET /api/stats - User stats data
│   │   ├── messages.ts         # CRUD operations for messages
│   │   ├── garden.ts           # Garden game endpoints
│   │   ├── reminders.ts        # Reminder management
│   │   ├── ai.ts               # AI/LLM endpoints
│   │   └── test-runs.ts        # Test run endpoints
│   │
│   ├── lib/
│   │   └── auth.ts             # Better Auth server config
│   │
│   └── index.ts                # Main server file - Hono app setup
│
├── drizzle/
│   └── schema.ts               # Database schema (Drizzle ORM)
│
├── .env                        # Environment variables
└── package.json                # Dependencies
```

#### Key Files:
- **Main Server**: `src/index.ts` - Runs on port 4000
- **Database Schema**: `drizzle/schema.ts` - All table definitions
- **Auth Config**: `src/lib/auth.ts` - Better Auth with Drizzle adapter
- **API Routes**: All routes in `src/routes/` directory

#### API Endpoints:
```
Base URL: http://localhost:4000

Auth:
  POST   /api/auth/sign-in/email
  POST   /api/auth/sign-up/email
  POST   /api/auth/sign-out
  GET    /api/auth/session

Stats:
  GET    /api/stats              # Get user's analyses and memories

Messages:
  GET    /api/messages           # List messages
  POST   /api/messages           # Create message
  GET    /api/messages/:id       # Get message
  PATCH  /api/messages/:id       # Update message
  DELETE /api/messages/:id       # Delete message

Garden:
  GET    /api/garden             # Get user's garden
  POST   /api/garden/plant       # Plant item

Reminders:
  [See routes/reminders.ts]

AI:
  [See routes/ai.ts]
```

---

### 3. **empathy-link** (Web App - SvelteKit)
Location: `/Users/alexanderbuckner/+Code/empathy-link/`

```
empathy-link/
├── src/
│   ├── routes/                  # SvelteKit file-based routing
│   │   └── bullshift/          # Main app routes
│   │       ├── stats/          # Stats pages
│   │       │   ├── +page.svelte        # Main stats page
│   │       │   ├── +page.server.ts     # Server load function
│   │       │   └── chats/              # Chat analysis pages
│   │       ├── learn/          # Learning module
│   │       ├── insights/       # Insights pages
│   │       ├── memory/         # Memory pages
│   │       └── backend/        # Admin backend pages
│   │
│   └── lib/
│       ├── components/          # Svelte components
│       │   ├── StatsOverview.svelte
│       │   ├── StatsFeelings.svelte
│       │   ├── StatsNeeds.svelte
│       │   ├── StatsMemories.svelte
│       │   ├── StatsInsights.svelte
│       │   ├── StatsChatOverview.svelte
│       │   └── Donut.svelte    # D3-based donut chart
│       │
│       ├── utils/              # Utility functions
│       └── translations.ts     # i18n functions
│
└── package.json
```

**Note**: This is the original Svelte implementation that was migrated to the Expo app.

---

## Database Schema (Drizzle/Postgres)

Location: `/Users/alexanderbuckner/+Code/empathy-link-backend/drizzle/schema.ts`

### Main Tables:

#### `user`
- User accounts and profiles
- Fields: id, name, email, username, firstName, lastName, role, etc.

#### `session`
- User authentication sessions
- Managed by Better Auth

#### `account`
- OAuth accounts and credentials
- Managed by Better Auth

#### `analyses`
- NVC analyses of conversations
- Fields: id, userId, chatId, title, observation, feelings (JSON), needs (JSON), sentiment metrics, etc.
- **Important**: `feelings` and `needs` are stored as JSON text, need to be parsed

#### `memories`
- Long-term memory storage for users
- Fields: id, userId, type, key, value, confidence, embedding (vector), priority, etc.
- Types: 'value', 'emotion', 'relationship', 'identity'
- Confidence levels: 'certain', 'likely', 'uncertain'

#### `chats`
- Chat conversations
- Fields: id, userId, module, history (JSON), feelings (JSON), needs (JSON), etc.

#### `feelings`
- Reference table for feelings/emotions
- Fields: id, nameDE, nameEN, category, positive

#### `gardens`
- User garden game data
- Fields: id, userId, gridData (JSON), weather, etc.

#### `messages`
- In-app messages and notifications
- Fields: id, userId, title, content, type, read, etc.

#### `learnSessions`
- Learning module progress
- Fields: id, userId, topicId, currentPage, responses (JSON), completed

---

## Data Flow

### Stats Page Example:

1. **User navigates to Stats tab** (`app/(protected)/(tabs)/stats.tsx`)
2. **Frontend calls API**: `fetch('http://localhost:4000/api/stats')`
3. **Backend middleware** (`src/index.ts`): Authenticates user via Better Auth
4. **Stats route** (`src/routes/stats.ts`):
   - Queries `analyses` table filtered by `userId`
   - Queries `memories` table filtered by `userId`
   - Parses JSON fields (feelings, needs)
   - Returns data as JSON
5. **Frontend receives data** and renders components:
   - StatsChatOverview shows analyses
   - StatsFeelings shows feelings donut chart
   - StatsNeeds shows needs donut chart
   - StatsMemories shows memories filtered by type

---

## Authentication Flow

1. **Better Auth** is used across all projects
   - Backend: `src/lib/auth.ts` - Server configuration
   - Expo: `lib/auth.ts` - Client configuration

2. **Session Management**:
   - Sessions stored in `session` table (Postgres)
   - Tokens stored in SecureStore (Expo)
   - Cookies (Web)

3. **Protected Routes**:
   - Expo: `useAuthGuard()` hook redirects to login if not authenticated
   - Backend: Auth middleware sets `user` in context

---

## Environment Variables

### Backend (`.env`):
```bash
DATABASE_URL=postgresql://...
SCHEDULED_TASK_AUTH_KEY=...
```

### Expo (`.env` in app root):
- `EXPO_PUBLIC_API_URL` – Backend API URL (optional; auto-detected for native)
- `EXPO_PUBLIC_BETTER_AUTH_URL` – Better Auth base URL (optional)
- `EXPO_PUBLIC_POSTHOG_API_KEY` – PostHog project API key (optional; enables analytics and error tracking)
- `EXPO_PUBLIC_POSTHOG_HOST` – PostHog host (optional; default `https://us.i.posthog.com`)
- `EXPO_PUBLIC_POSTHOG_DEV_ENABLED` – Set to enable PostHog in `__DEV__` (optional)

---

## Development Workflow

### Starting the Backend:
```bash
cd /Users/alexanderbuckner/+Code/empathy-link-backend
npm run dev  # or npm start
```

### Starting Expo App:
```bash
cd /Users/alexanderbuckner/+Code/empathy-link-expo
npm start
```

### Database Migrations:
```bash
cd /Users/alexanderbuckner/+Code/empathy-link-backend
# Run Drizzle migrations
npx drizzle-kit push  # or your migration command
```

---

## Key Technologies

- **Expo/React Native**: Mobile app framework
- **Hono**: Lightweight web framework for backend
- **Drizzle ORM**: TypeScript ORM for Postgres
- **Better Auth**: Authentication library
- **NativeWind**: Tailwind CSS for React Native
- **Expo Router**: File-based routing for Expo
- **React Native SVG**: SVG support for charts

---

## Common Tasks

### Adding a new API endpoint:
1. Create route file in `empathy-link-backend/src/routes/`
2. Import and register in `src/index.ts`
3. Add types/interfaces if needed
4. Call from Expo using fetch

### Adding a new screen:
1. Create file in `empathy-link-expo/app/(protected)/` or `app/(auth)/`
2. Use `useAuthGuard()` if protected
3. Style with NativeWind or StyleSheet

### Querying the database:
1. Import schema from `drizzle/schema.ts`
2. Import db helper functions from `drizzle-orm`
3. Use Drizzle query builder in route handler

### Adding translations:
1. Add keys to `messages/de.json` and `messages/en.json`
2. Use in components via i18n setup

---

## Notes

- The Expo app is currently pointing to `localhost:4000` - this needs to be updated for production
- JSON fields in Postgres need to be parsed when retrieved (feelings, needs, etc.)
- Memory embeddings use pgvector for similarity search
- The backend has TODO comments where database queries need to be implemented
