# Next.js Quiz App 🎯

Modern real-time multiplayer quiz application built with Next.js 14 App Router, Server Actions, and PostgreSQL.

## Features

- **Next.js 14 App Router** - Modern React with Server Components
- **Server Actions** - No separate API, all backend logic integrated
- **Iron Session** - Secure session management
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Reliable data persistence
- **TailwindCSS** - Beautiful gradient UI
- **Docker Compose** - One-command deployment

## Quick Start

```bash
# Start application
docker compose up --build

# Access at http://localhost:3000
```

## Usage

1. **Host Mode**: Go to `/host`, login with password `admin123`
2. **Create Quiz**: Add teams, domains, and questions
3. **Team Mode**: Go to `/team`, enter Quiz ID
4. **Join Team**: Select team and enter player name
5. **Play**: Host starts rounds, teams answer questions

## Architecture

- **App Router**: Server Components by default, Client Components where needed
- **Server Actions**: All mutations (create team, submit answer, etc.)
- **Sessions**: Iron Session for authentication and state
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Built-in with Server Actions and revalidation

## Project Structure

```
nextjs-quiz/
├── src/
│   ├── app/              # App Router pages
│   │   ├── page.tsx      # Home (mode select)
│   │   ├── host/         # Host login
│   │   ├── team/         # Team join
│   │   └── quiz/[quizId]/
│   │       ├── host/     # Host dashboard
│   │       └── team/     # Team interface
│   ├── components/       # React components
│   └── lib/
│       ├── actions.ts    # Server Actions
│       ├── db.ts         # Prisma client
│       └── session.ts    # Session management
├── prisma/
│   └── schema.prisma     # Database schema
└── docker-compose.yml    # Docker setup
```

## Environment Variables

```env
DATABASE_URL="postgresql://quizuser:quizpass@postgres:5432/quizdb"
SESSION_SECRET="your-secret-key-min-32-chars"
HOST_PASSWORD="admin123"
```

## Development

```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma db push

# Start dev server
npm run dev
```

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Prisma
- PostgreSQL
- TailwindCSS
- Iron Session
- Docker

---

Built with ❤️ using Next.js Server Actions
