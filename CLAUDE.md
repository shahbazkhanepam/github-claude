# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** is an AI-powered React component generator with live preview. Users describe components they want to create, and Claude generates them in a virtual file system that never touches the disk. The app includes live preview, code editing, user authentication, project persistence, and AI usage tracking.

- **Primary Language**: TypeScript, React, Next.js
- **Key AI Integration**: Anthropic Claude API with Vercel AI SDK for streaming
- **Database**: Prisma ORM with SQLite
- **Default Model**: `claude-haiku-4-5`

## Setup & Development Commands

### Initial Setup
```bash
npm run setup
```
This installs dependencies, generates the Prisma client, and runs database migrations. **Important**: Do not run `npm audit fix` — dependencies are pinned to specific versions that work together. Security updates are managed by directly updating pinned versions.

### Running the App
```bash
npm run dev          # Start dev server (uses Turbopack for fast rebuilds)
npm run dev:daemon   # Start server in background, logs to logs.txt
npm run build        # Build for production
npm run start        # Run production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run test -- --ui # Run tests with UI
npm run test -- src/lib/__tests__/file-system.test.ts  # Run a single test
```

### Database
```bash
npm run db:reset     # Reset database (destroys data, recreates schema)
npx prisma studio   # Open Prisma Studio to browse/edit data
```

## Architecture & Key Components

### File Structure Overview
- **`src/app/`** - Next.js App Router pages and API routes
  - `[projectId]/page.tsx` - Main editor for a project
  - `api/chat/route.ts` - Core AI endpoint that streams component generation
  - `api/usage/` - User usage tracking endpoints
  - `usage/page.tsx` - Analytics dashboard
- **`src/components/`** - React components organized by feature:
  - `chat/` - Chat interface, message list, input
  - `editor/` - Code editor and tabs
  - `preview/` - Live preview container
  - `auth/` - Sign-in/sign-up forms
  - `ui/` - Radix UI primitives (dialog, tabs, button, etc.)
- **`src/lib/`** - Core utilities and business logic:
  - `file-system.ts` - VirtualFileSystem class for in-memory file operations
  - `auth.ts` - Session management with JWT and httpOnly cookies
  - `provider.ts` - Language model setup (real Claude or MockLanguageModel)
  - `prisma.ts` - Prisma client singleton
  - `tools/` - AI tools (str_replace_editor, file_manager)
  - `prompts/` - System prompts for the AI
  - `contexts/` - React contexts (ChatProvider, FileSystemProvider)
  - `transform/` - JSX transformers for React 19 compatibility
  - `usage-tracker.ts` - Track AI usage and costs
- **`prisma/`** - Database schema (User, Project, AIUsage models)

### Virtual File System
The app uses an in-memory `VirtualFileSystem` class (not persistent to disk). Claude uses two tools to manipulate it:
- **`str_replace_editor`** - Create/edit/delete files by string replacement
- **`file_manager`** - List directories, create directories

The file system is serialized and sent with each chat request, then reconstructed in the API handler. No state persists between requests except what's saved in the database.

### AI Generation Flow
1. User sends a chat message
2. Message is sent to `/api/chat` with the virtual file system serialized as JSON
3. Claude receives the system prompt (cached with ephemeral cache), messages, and tools
4. Claude uses tools to create/modify files in the virtual file system
5. Stream is returned to the client, which updates the file system and live preview
6. On completion, usage (tokens, cost) is tracked in the database

### Authentication & Sessions
- JWT-based sessions stored in httpOnly cookies
- 7-day expiration
- Available to signed-in users and anonymous users (anonymous sessions are tracked separately)
- `getSession()` reads from cookies; `createSession()` writes new session

### Data Models
```typescript
// User - registered account holders
model User {
  id, email, password, projects[], aiUsage[], timestamps
}

// Project - component generation workspace
model Project {
  id, name, userId, messages (JSON), data (JSON), timestamps
}

// AIUsage - track each AI call
model AIUsage {
  id, userId, projectId, model, inputTokens, outputTokens, totalTokens,
  estimatedCost, duration, status, errorMessage, metadata, createdAt
}
```

## Key Integration Points

### Claude AI Calls
- **Endpoint**: `/api/chat` (POST)
- **Input**: User message, serialized virtual file system, project ID
- **Output**: Streamed text deltas and tool calls
- **System Prompt**: `src/lib/prompts/generation.tsx` (cached with ephemeral cache)
- **Provider**: Real Claude via `@ai-sdk/anthropic` if `ANTHROPIC_API_KEY` is set; otherwise MockLanguageModel returns canned responses

### Usage Tracking
- Tracked in `onFinish` hook in the chat route (`src/app/api/chat/route.ts`)
- Costs calculated from token counts using Haiku pricing ($0.80 / 1M input, $4.00 / 1M output)
- Recorded to AIUsage table with user and project associations
- Dashboard at `/usage` shows aggregated stats

### File Serialization
- Files are serialized as a flat JSON structure with path and content
- Tools receive and return JSON-encoded file structures
- JSX transformation applies React 19 patterns before rendering

## Environment Variables

```env
# Anthropic API key (required for real AI; leave as placeholder to use mock)
ANTHROPIC_API_KEY=sk-ant-...

# JWT secret for sessions (development default provided)
JWT_SECRET=your-secret-key

# Prisma database URL (defaults to SQLite in prisma/dev.db)
DATABASE_URL=file:./dev.db
```

If `ANTHROPIC_API_KEY` is missing or set to the placeholder `your-api-key-here`, the app falls back to MockLanguageModel, which returns hard-coded component examples.

## Common Workflows

### Adding a New AI Tool
1. Create tool in `src/lib/tools/my-tool.ts` with signature matching Vercel AI SDK
2. Export a builder function like `buildMyTool(fileSystem)`
3. Add to tools object in `/api/chat/route.ts`
4. Claude will discover the tool via schema introspection

### Modifying System Prompts
- Edit `src/lib/prompts/generation.tsx`
- Wrapped in ephemeral cache control for cost optimization
- Changes take effect on next request

### Tracking New Usage Metrics
- Extend `AIUsage` model in `prisma/schema.prisma`
- Migrate with `npx prisma migrate dev --name describe_change`
- Update `trackUsage()` in `src/lib/usage-tracker.ts`

### Testing Without API Key
- Keep `ANTHROPIC_API_KEY` as placeholder in `.env`
- MockLanguageModel will serve canned responses
- Useful for frontend development and UI testing

## Known Constraints

1. **Database**: SQLite — single-user development. For multi-user production, migrate to PostgreSQL.
2. **File System**: In-memory only. Projects saved to database; files reconstructed from storage.
3. **Model**: Hard-coded to Haiku. To switch models, update `MODEL` constant in `src/lib/provider.ts`.
4. **Cache Control**: System prompt uses ephemeral cache. Change in `src/app/api/chat/route.ts` if different caching is needed.

## Testing Notes

- Use Vitest for unit tests
- Browser-based tests can drive the preview
- Tests in `src/lib/__tests__/` cover file system and contexts
- Run `npm run test` to execute all tests
