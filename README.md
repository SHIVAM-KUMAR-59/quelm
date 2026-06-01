![Dashboard](./preview.png)

# Quelm

A distributed multi-agent workflow platform where AI agents collaborate asynchronously to execute complex workflows at scale. Built with event-driven architecture, message queues, real-time orchestration, and a visual workflow builder.

> **Status:** Active Development &nbsp;|&nbsp; **Stack:** TypeScript · Next.js · Express · BullMQ · PostgreSQL · Redis · Groq

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Workflows](#workflows)
  - [Runs](#runs)
  - [Agents](#agents)
- [Agent Types](#agent-types)
- [Workflow Definition Schema](#workflow-definition-schema)
- [How It Works](#how-it-works)
  - [Creating a Workflow](#creating-a-workflow)
  - [Triggering a Run](#triggering-a-run)
  - [Live Run Monitor](#live-run-monitor)
  - [Retry and Failure Handling](#retry-and-failure-handling)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Overview

Quelm is a general-purpose distributed workflow platform where users visually compose workflows by connecting AI agents on a canvas, trigger runs with a JSON input payload, and watch them execute live in real time.

Under the hood, tasks flow through BullMQ queues on Redis, workers process them independently with automatic retries and exponential backoff, and an event-driven orchestrator dispatches downstream tasks as dependencies complete. Every execution is fully persisted in PostgreSQL with a complete audit trail.

---

## Features

- **Visual Workflow Builder** — drag and drop agent nodes onto a canvas, connect them with edges, configure each node with prompts, URLs, or transformation logic
- **Live Run Monitor** — watch a workflow execute in real time with per-node status updates via Server-Sent Events
- **Distributed Workers** — each agent type runs as an independent worker process, scales horizontally without code changes
- **Dependency Resolution** — parallel execution, fan-out, and sequential chains all handled automatically based on the graph structure
- **Retry Logic** — exponential backoff with configurable max attempts per task, dead-letter handling for permanently failed jobs
- **Critical Task Control** — mark any node as critical to fail the entire workflow on failure, or non-critical to skip and continue
- **Agent Heartbeat** — every worker reports its liveness every 30 seconds, the dashboard shows real-time agent health
- **Modular Agent System** — extend `BaseAgent` to add any new agent type without touching the orchestrator
- **Structured Observability** — structured JSON logs in production, per-request logging, full task input/output history in the database

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client (Next.js + Vercel)"]
        WB["Workflow Builder\nReact Flow canvas"]
        RM["Run Monitor\nLive SSE updates"]
        DB["Dashboard\nMetrics & agents"]
    end

    subgraph API["REST API (Express)"]
        WR["/api/workflows"]
        RR["/api/runs"]
        AR["/api/agents"]
        SSE["/api/runs/:id/stream\nSSE endpoint"]
    end

    subgraph Orchestrator["Orchestrator"]
        OC["Workflow engine\nDependency resolver"]
        QE["QueueEvents\nCompletion listener"]
        RE["RunEmitter\nEvent broadcast"]
    end

    subgraph Queues["BullMQ Queues (Redis)"]
        LQ["LLM_AGENT"]
        HQ["HTTP_AGENT"]
        TQ["TRANSFORM_AGENT"]
        EQ["EXTRACTION_AGENT"]
        NQ["NOTIFICATION_AGENT"]
        SQ["STORAGE_AGENT"]
    end

    subgraph Workers["Agent Workers"]
        LA["LLM Agent\nGroq API"]
        HA["HTTP Agent"]
        TA["Transform Agent"]
    end

    subgraph Storage["Storage"]
        PG[("PostgreSQL\nWorkflows · Runs · Tasks · Agents")]
        RD[("Redis\nJob queues · State")]
    end

    WB -->|"POST /api/workflows"| WR
    WB -->|"POST /api/workflows/:id/run"| WR
    RM -->|"GET /api/runs/:id/stream"| SSE
    DB -->|"GET /api/agents"| AR
    DB -->|"GET /api/runs"| RR

    WR --> OC
    OC -->|"Dispatch first tasks"| LQ
    OC -->|"Dispatch first tasks"| HQ
    QE -->|"completed / failed"| OC
    OC -->|"Dispatch next tasks"| LQ
    OC --> RE
    RE -->|"Push status event"| SSE

    LQ -->|"Pull job"| LA
    HQ -->|"Pull job"| HA
    TQ -->|"Pull job"| TA

    LA -->|"Update task"| PG
    HA -->|"Update task"| PG
    TA -->|"Update task"| PG

    OC -->|"Update run state"| PG
    API --> PG
    Queues --- RD
```

---

## Tech Stack

| Layer            | Technology                     | Purpose                                 |
| ---------------- | ------------------------------ | --------------------------------------- |
| Language         | TypeScript                     | End-to-end type safety                  |
| Package Manager  | pnpm                           | Fast installs, strict workspace support |
| Frontend         | Next.js + Tailwind + shadcn/ui | Full-stack React, deploys to Vercel     |
| Workflow Canvas  | React Flow                     | Node-based visual editor                |
| Backend          | Node.js + Express              | REST API server                         |
| Queue System     | BullMQ + Redis                 | Task distribution, retries, job state   |
| Database         | PostgreSQL + Prisma            | Persistent workflow and run state       |
| AI Provider      | Groq (LLaMA 3.3 70B)           | Fast LLM inference, generous free tier  |
| Real-time        | Server-Sent Events             | Live run monitor updates                |
| Containerization | Docker Compose                 | Local Postgres and Redis                |
| Deployment       | Vercel + Render                | Frontend and backend hosting            |

---

## Project Structure

```
quelm/
├── client/                         # Next.js frontend
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

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quelm.git
cd quelm

# Install all dependencies
pnpm install
```

### Environment Variables

Create the following `.env` files:

**Root `.env`** — Docker Compose infrastructure:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=agent_platform
```

**`server/.env`** — Application config:

```env
# App
PORT=8000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_platform

# Redis
REDIS_URL=redis://localhost:6379

# Client URL (deployed frontend, for CORS)
CLIENT_URL=http://localhost:3000

# Groq
GROQ_API_KEY=your_groq_api_key_here
```

**`client/.env.local`** — Frontend config:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Copy the example files as a starting point:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### Running Locally

**1. Start infrastructure:**

```bash
docker compose up -d
```

**2. Run database migrations:**

```bash
cd server
pnpm prisma migrate dev
```

**3. Start the server:**

```bash
# From root
pnpm dev:server
```

**4. Start the client:**

```bash
# From root
pnpm dev:client
```

The API will be available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

---

## API Reference

All endpoints return responses in the following shape:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Errors follow this shape:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "NOT_FOUND"
}
```

### Workflows

| Method | Endpoint                | Description                      |
| ------ | ----------------------- | -------------------------------- |
| `GET`  | `/api/workflow`         | List all workflow definitions    |
| `GET`  | `/api/workflow/:id`     | Get a single workflow definition |
| `POST` | `/api/workflow`         | Create a new workflow definition |
| `POST` | `/api/workflow/:id/run` | Trigger a workflow run           |

**Create a workflow:**

```bash
POST /api/workflow
Content-Type: application/json

{
  "data": {
    "name": "Company Research Pipeline",
    "description": "Researches a company and analyses sentiment",
    "definition": {
      "nodes": [...],
      "edges": [...]
    }
  }
}
```

**Trigger a run:**

```bash
POST /api/workflow/:id/run
Content-Type: application/json

{
  "data": {
    "input": {
      "company_name": "Anthropic"
    }
  }
}
```

### Runs

| Method | Endpoint                         | Description                     |
| ------ | -------------------------------- | ------------------------------- |
| `GET`  | `/api/runs`                      | List all workflow runs          |
| `GET`  | `/api/runs/:id`                  | Get a run with all its tasks    |
| `GET`  | `/api/runs/workflow/:workflowId` | Get all runs for a workflow     |
| `GET`  | `/api/runs/:id/stream`           | SSE stream for live run updates |

### Agents

| Method | Endpoint          | Description                |
| ------ | ----------------- | -------------------------- |
| `GET`  | `/api/agents`     | List all registered agents |
| `GET`  | `/api/agents/:id` | Get a single agent         |

---

## Agent Types

| Type                 | Description                                        | Use Case                                                  |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `LLM_AGENT`          | Calls Groq with a configurable prompt template     | Summarisation, classification, extraction, generation     |
| `HTTP_AGENT`         | Makes an HTTP request to any external API          | Fetching data, sending webhooks, third-party integrations |
| `TRANSFORM_AGENT`    | Transforms and reshapes JSON data                  | Filtering fields, mapping values, formatting              |
| `EXTRACTION_AGENT`   | Extracts structured data from unstructured sources | Web scraping, PDF parsing, raw text parsing               |
| `NOTIFICATION_AGENT` | Sends notifications                                | Emails, Slack messages, webhooks                          |
| `STORAGE_AGENT`      | Reads from or writes to external storage           | Saving results, reading files, S3 operations              |

---

## Workflow Definition Schema

A workflow definition is a JSON object with `nodes` and `edges`:

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "LLM_AGENT",
      "name": "Research Company",
      "critical": true,
      "config": {
        "promptTemplate": "Research {{company_name}} and summarise their recent news in 3 bullet points.",
        "model": "llama-3.3-70b-versatile",
        "maxTokens": 500
      }
    },
    {
      "id": "node_2",
      "type": "LLM_AGENT",
      "name": "Sentiment Analysis",
      "critical": true,
      "config": {
        "promptTemplate": "Analyse the sentiment of this text — return positive, negative, or neutral with a one sentence reason: {{text}}",
        "model": "llama-3.3-70b-versatile",
        "maxTokens": 100
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

Prompt templates support `{{variable}}` placeholders. The first node receives the run input as its variables. Subsequent nodes receive the output of their dependency tasks.

---

## How It Works

### Creating a Workflow

Open the Workflow Builder, drag agent nodes onto the canvas, connect them with edges, and configure each node's prompt or settings in the side panel. Save the workflow — it gets stored as a JSON definition in PostgreSQL.

### Triggering a Run

Click Run on any saved workflow, fill in the input payload, and hit Execute. The API creates a `WorkflowRun` row, instantiates `Task` rows for every node, builds a dependency map from the edges, and dispatches the first tasks (those with no incoming edges) to the appropriate BullMQ queues. The run starts asynchronously and the API returns immediately with a `runId`.

### Live Run Monitor

The frontend opens an SSE connection to `/api/runs/:id/stream`. As each task completes, the worker updates the database and the orchestrator emits an event on the `RunEmitter`. The SSE endpoint pushes that event to the browser — the canvas node changes colour (blue for running, green for completed, red for failed) without a single page refresh.

### Retry and Failure Handling

Every task has a configurable `maxAttempts` (default 3). BullMQ retries failed jobs with exponential backoff. If a task marked `critical: true` exhausts all attempts, the entire workflow run is marked `FAILED` and all pending tasks are cancelled. Non-critical task failures are logged and skipped — the run continues with remaining tasks.

### Stale Run Timeout

Runs that have been in `RUNNING` status for more than 10 minutes with no task activity (no task has reached `RUNNING` or `COMPLETED`) are automatically marked as `FAILED` and all pending tasks are cancelled. A background job runs every 5 minutes to detect and clean up stale runs. This covers edge cases where invalid configuration, type mismatches, or worker unavailability prevent any task from progressing.

---

## Deployment

### Frontend — Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the root directory to `client`
4. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to your Render backend URL
5. Deploy — Vercel auto-deploys on every push to `main`

### Backend — Render

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repository and set the root directory to `server`
3. Set the build command to `pnpm install && pnpm prisma generate && pnpm build`
4. Set the start command to `pnpm start`
5. Add a **PostgreSQL** database from the Render dashboard — it injects `DATABASE_URL` automatically
6. Add a **Redis** instance from the Render dashboard — copy the external URL into `REDIS_URL`
7. Add remaining environment variables — `GROQ_API_KEY`, `PORT`, `NODE_ENV=production`
8. Deploy

> Both Vercel and Render have free tiers that cover this project with no credit card required.

---

## Roadmap

- [x] User authentication (JWT + refresh tokens)
- [x] HTTP Agent implementation
- [x] Transform Agent implementation
- [ ] Node name editing in the workflow builder
- [ ] Workflow versioning
- [ ] Scheduled workflow triggers (cron)
- [ ] Webhook triggers
- [ ] Multi-tenancy support

---

## Contributing

Contributions, issues, and feature requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, coding standards, branching strategy, and a step-by-step guide to adding new agent types.

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/my-feature`
3. Commit your changes — `git commit -m 'feat: add my feature'`
4. Push to the branch — `git push origin feature/my-feature`
5. Open a Pull Request against `dev`
