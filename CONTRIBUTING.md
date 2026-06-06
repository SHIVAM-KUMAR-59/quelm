# Contributing to Quelm

Thanks for your interest in contributing to Quelm. This document covers everything you need to get started — project structure, development setup, coding standards, and the contribution workflow.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Branching Strategy](#branching-strategy)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Adding a New Agent Type](#adding-a-new-agent-type)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

Be respectful, constructive, and collaborative. Contributions of all sizes are welcome — bug fixes, documentation improvements, new agent types, and feature additions are all valued equally.

---

## Getting Started

Before contributing, make sure you understand the core concepts:

- **Workflow** — a visual graph of agent nodes connected by edges, saved as a JSON definition
- **Run** — a live execution of a workflow definition with a specific input payload
- **Agent** — a worker process that handles a specific type of task (LLM, HTTP, Transform, etc.)
- **Orchestrator** — the engine that dispatches tasks, resolves dependencies, and tracks run state

If anything is unclear, open a discussion before starting work.

---

## Project Structure

```
quelm/
├── client/                         # Next.js frontend
│   ├── __tests__/                  # Test Suite
│   ├── app/                        # App router pages
│   ├── components/                 # React components
│   ├── hooks/                      # Custom hooks for API calling
│   ├── lib/                        # Utility methods and types
│   ├── providers/                  # Context providers
│   └── package.json
├── server/                         # Express backend
│   ├── agents/                     # Agent worker implementations
│   │   ├── base.agent.ts           # Abstract base class
│   │   ├── llm.agent.ts            # Groq LLM agent
│   │   └── registry.ts             # Agent startup registry
│   ├── __tests__/                  # Test suite
│   │   ├── api/                    # API integration tests (supertest)
│   │   ├── helpers/                # Mock factories and app builder
│   │   ├── orchestrator/           # Orchestrator workflow tests
│   │   ├── services/               # Service layer unit tests
│   │   ├── utils/                  # Utility function tests
│   │   └── setup.ts                # Global mocks and env config
│   ├── agents/                     # Agent worker implementations
│   │   ├── base.agent.ts           # Abstract base class
│   │   ├── llm.agent.ts            # Groq LLM agent
│   │   └── registry.ts             # Agent startup registry
│   ├── api/                        # Modular REST API
│   │   ├── workflow/               # Workflow module
│   │   ├── run/                    # Run module
│   │   └── agent/                  # Agent module
│   ├── config/                     # App configuration
│   │   ├── index.ts                # Typed env variables
│   │   ├── logger.config.ts        # Winston logger
│   │   ├── prisma.config.ts        # Prisma singleton
│   │   ├── redis.config.ts         # Redis singleton
│   │   └── groq.config.ts          # Groq client singleton
│   ├── events/
│   │   └── run.emitter.ts          # In-process event emitter for SSE
│   ├── orchestrator/
│   │   └── index.ts                # Workflow orchestration engine
│   ├── queue/
│   │   └── index.ts                # BullMQ queue abstraction
│   ├── middleware/
│   │   └── error.middleware.ts     # Global error handler
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── utils/
│   │   ├── errors.ts               # Typed API error classes
│   │   ├── types.ts                # Shared TypeScript types
│   │   └── template.utils.ts       # Prompt interpolation
│   └── index.ts                    # Server entry point
├── docker-compose.yml              # Postgres + Redis
├── .eslintrc.js                    # Shared ESLint config
├── .prettierrc                     # Shared Prettier config
├── tsconfig.base.json              # Base TypeScript config
└── pnpm-workspace.yaml             # pnpm workspace config
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop

### Install dependencies

```bash
git clone https://github.com/yourusername/quelm.git
cd quelm
pnpm install
```

### Environment variables

```bash
# Root — Docker Compose
cp .env.example .env

# Server — application config
cp server/.env.example server/.env

# Client — API URL
cp client/.env.local.example client/.env.local
```

Fill in `server/.env` with your Groq API key. Get one free at [console.groq.com](https://console.groq.com).

### Start infrastructure

```bash
docker compose up -d
```

### Run database migrations

```bash
cd server
pnpm prisma migrate dev
```

### Start development servers

```bash
# From root — starts both client and server
pnpm dev:server   # http://localhost:8000
pnpm dev:client   # http://localhost:3000
```

### Verify everything works

```bash
curl http://localhost:8000/health
# Should return { "status": "ok" }
```

### Run tests

```bash
# Run all backend tests
pnpm test:server

# Watch mode
pnpm test:server:watch

# Run all frontend tests
pnpm test:client

# Watch mode
pnpm test:client:watch
```

---

## Coding Standards

All code must pass linting and formatting checks before merging.

```bash
pnpm lint          # ESLint across client and server
pnpm format        # Prettier write
```

### TypeScript

- Strict mode is enabled — no implicit `any`
- Always define explicit return types on public methods and exported functions
- Use the typed error classes from `server/utils/errors.ts` — never throw raw strings
- Use the typed controller utilities from `client/lib/types.ts` — `Controller`, `BodyController`, `ParamsController`

### Naming conventions

| Thing                   | Convention               | Example                                 |
| ----------------------- | ------------------------ | --------------------------------------- |
| Files                   | kebab-case               | `llm.agent.ts`, `workflow.service.ts`   |
| Classes                 | PascalCase               | `BaseAgent`, `WorkflowService`          |
| Functions and variables | camelCase                | `triggerRun`, `jobQueue`                |
| Constants               | SCREAMING_SNAKE_CASE     | `MAX_RETRIES`, `DEFAULT_MODEL`          |
| Database tables         | snake_case               | `workflow_definitions`, `workflow_runs` |
| React components        | PascalCase               | `AgentNode`, `StatCard`                 |
| React component files   | PascalCase or kebab-case | `AgentNode.tsx` or `agent-node.tsx`     |

### Architecture rules

- **Controllers** — HTTP concerns only. Read `req`, call service, send `res`. No business logic, no database calls.
- **Services** — business logic only. No Express objects. Throw typed errors on invalid states.
- **Repositories** — database only. One query per method. No logging, no error handling.
- **Agents** — extend `BaseAgent` and implement `execute()` only. Never touch queues or databases directly inside `execute()`.
- **No `console.log`** — use the Winston logger from `server/config/logger.config.ts`
- **No `process.env` outside config** — all environment variables are read in `server/config/index.ts` and exported as typed constants

---

## Branching Strategy

```
main          ← production-ready, protected
feature/*     ← new features
fix/*         ← bug fixes
chore/*       ← tooling, deps, config changes
docs/*        ← documentation only
```

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>(<scope>): <short description>

[optional body]
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `chore`    | Tooling, dependencies, config                           |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `perf`     | Performance improvement                                 |

### Examples

```
feat(agents): add HTTP agent worker implementation
fix(orchestrator): resolve race condition in dependency dispatch
chore(deps): upgrade prisma to 6.3.0
docs(readme): add deployment instructions for Railway
refactor(api): extract workflow validation into service layer
```

---

## Pull Request Process

1. **Branch** from `main` with a descriptive name
2. **Write clean code** — follow the coding standards above
3. **Test manually** — trigger a workflow run and verify end to end
4. **Run checks locally** before pushing:
   ```bash
   pnpm lint && pnpm format
   ```
5. **Run all tests locally** before pushing:
   ```bash
   pnpm test:server # test server(backend)
   pnpm test:client # test client(frontend)
   ```
6. **Open a PR** against `main` with:
   - A clear title following the commit message format
   - A description of what changed and why
   - Screenshots or screen recordings for UI changes
   - Notes on any breaking changes
7. **Address review feedback** — keep the conversation constructive
8. **Squash commits** before merging if the branch has noisy interim commits

> PRs with failing CI checks will not be merged.

---

## Adding a New Agent Type

Adding a new agent is the most common contribution. The architecture is designed so this requires changes in exactly four places:

### 1. Add the enum value to the Prisma schema

```prisma
// server/prisma/schema.prisma
enum AgentType {
  LLM_AGENT
  HTTP_AGENT
  TRANSFORM_AGENT
  EXTRACTION_AGENT
  NOTIFICATION_AGENT
  STORAGE_AGENT
  YOUR_NEW_AGENT  // ← add here
}
```

Run `pnpm prisma migrate dev --name add-your-new-agent`.

### 2. Create the agent worker

```typescript
// server/agents/your-new.agent.ts
import { AgentType, PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base.agent";

interface YourAgentInput {
  // define input shape
}

interface YourAgentConfig {
  // define config shape
}

export class YourNewAgent extends BaseAgent {
  constructor(name: string, concurrency: number = 1, prisma: PrismaClient) {
    super(name, AgentType.YOUR_NEW_AGENT, concurrency, prisma);
  }

  async execute(input: unknown, config: unknown): Promise<unknown> {
    const typedInput = input as YourAgentInput;
    const typedConfig = config as YourAgentConfig;

    // your implementation here

    return { result: "..." };
  }
}
```

### 3. Register the agent in the registry

```typescript
// server/agents/registry.ts
import { YourNewAgent } from "./your-new.agent";

const yourNewAgent = new YourNewAgent("YOUR_NEW_AGENT_1", 1, prisma);
const agents = [llmAgent, yourNewAgent];
```

### 4. Add the node type to the frontend builder

```typescript
// client/components/workflows/builder/NodePalette.tsx
{
  type: "YOUR_NEW_AGENT",
  name: "Your New Agent",
  description: "What this agent does",
  icon: YourIcon,
}
```

Add the agent meta to `AgentNode.tsx` and config fields to `NodeConfigPanel.tsx`.

That's it. The queue, orchestrator, and run monitor all handle the new type automatically.

---

## Reporting Bugs

Open a GitHub Issue with:

- **Title** — short description of the bug
- **Steps to reproduce** — numbered, specific
- **Expected behaviour** — what should happen
- **Actual behaviour** — what actually happens
- **Environment** — Node version, OS, browser if frontend
- **Logs** — relevant server logs or browser console errors
- **Screenshots** — if it's a UI issue

Use the `bug` label.

---

## Suggesting Features

Open a GitHub Issue with:

- **Title** — short description of the feature
- **Problem** — what gap or friction does this address
- **Proposed solution** — how you'd implement it
- **Alternatives considered** — other approaches you thought about
- **Scope** — is this a small addition or a large architectural change

Use the `enhancement` or `feature` label. For large changes, open a discussion first before writing any code — it avoids wasted effort if the direction isn't right.

---

## Questions

Open a GitHub Discussion if you have questions about the codebase, architecture decisions, or contribution ideas. Issues are for bugs and feature requests only.
