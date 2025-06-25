# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is currently in active development. The basic setup is complete with Next.js, TypeScript, Tailwind CSS, and testing infrastructure.

## Development Environment Context

Based on the workspace patterns, the following technologies are commonly used:
- **Backend**: Go (Golang) for API services
- **Frontend**: Next.js (React) for web interfaces  
- **Database**: PostgreSQL
- **Containerization**: Docker and docker-compose
- **Version Control**: Git (note: this directory is not yet a git repo)

## Common Project Patterns in This Workspace

When initializing or developing this project, consider these common patterns from other projects in the workspace:

### Go Projects
- Use `go mod init` to initialize Go modules
- Create `cmd/` directory for application entry points
- Use `internal/` for private application code
- Common commands:
  - `go mod tidy` - manage dependencies
  - `go build` - build the application
  - `go test ./...` - run all tests

### Next.js Projects
- Initialize with `npx create-next-app` or `pnpm create next-app`
- Use TypeScript for type safety
- Common commands:
  - `npm run dev` or `pnpm dev` - start development server
  - `npm run build` or `pnpm build` - build for production
  - `npm run lint` or `pnpm lint` - run linting

### Docker Setup
- Create `Dockerfile` for each service
- Use `docker-compose.yml` for local development
- Common patterns include multi-stage builds for Go applications

## Project Overview

Sticky-Lite is a minimalist sticky notes PWA where users can:
- Write sticky notes
- Place them freely on a board 
- Drag and drop to move notes
- Delete notes by dragging to trash
- Persist notes in localStorage

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Testing**: Jest + React Testing Library (unit), Playwright (E2E)
- **Containerization**: Docker with multi-stage builds
- **Package Manager**: pnpm

## Common Commands

### Development
```bash
# Start development server locally
pnpm dev

# Start with Docker
docker compose up

# Install dependencies
pnpm install
```

### Testing
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run tests in Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Linting & Type Checking
```bash
# Run ESLint
pnpm lint

# Type check (when available)
pnpm typecheck
```

### Build & Production
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
app/
├── (sticky)/          # Sticky notes feature group
│   ├── components/    # React components
│   ├── store/        # Zustand store
│   └── page.tsx      # Main sticky board page
├── layout.tsx        # Root layout
└── page.tsx          # Home page (redirects to sticky)

tests/
├── unit/             # Jest unit tests
└── e2e/              # Playwright E2E tests
```

## Development Guidelines

1. **TDD Approach**: Write tests first (red), implement (green), then refactor
2. **Component Testing**: Use data-testid attributes for testing
3. **State Management**: Use Zustand for global state with localStorage persistence
4. **Styling**: Use Tailwind CSS utility classes
5. **Type Safety**: Ensure all code is properly typed with TypeScript