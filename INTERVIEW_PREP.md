# Quelm — Interview Preparation Guide

A comprehensive set of questions, answers, key terminology, and tradeoffs for discussing the Quelm distributed multi-agent workflow platform in technical interviews.

---

## Table of Contents

- [System Design Questions](#system-design-questions)
- [Backend & Architecture Questions](#backend--architecture-questions)
- [Queue & Distributed Systems Questions](#queue--distributed-systems-questions)
- [Database & ORM Questions](#database--orm-questions)
- [Frontend Questions](#frontend-questions)
- [Real-time & SSE Questions](#real-time--sse-questions)
- [AI & Agent Questions](#ai--agent-questions)
- [DevOps & Infrastructure Questions](#devops--infrastructure-questions)
- [Key Terminology](#key-terminology)
- [Key Tradeoffs Made](#key-tradeoffs-made)
- [Behavioural Questions](#behavioural-questions)

---

## System Design Questions

### Q: Walk me through the architecture of Quelm at a high level.

Quelm is a distributed multi-agent workflow platform with three main layers.

The **frontend** is a Next.js app where users visually compose workflows using a React Flow canvas, trigger runs with a JSON input payload, and watch execution in real time via Server-Sent Events.

The **backend** is an Express API server that handles workflow CRUD, triggers runs via an orchestrator, and exposes an SSE endpoint for live updates. It runs agent workers as part of the same process — workers listen to BullMQ queues on Redis and process tasks independently.

The **infrastructure** is Docker Compose locally with Postgres for persistent state and Redis for the queue system. In production the frontend deploys to Vercel and the backend to Railway.

The key insight is the separation between the **orchestrator** (which manages workflow progression) and the **agents** (which execute individual tasks). They communicate through queues and a shared database, never directly.

---

### Q: How does a workflow execute from start to finish?

1. User creates a workflow definition — a JSON graph of nodes and edges saved in Postgres
2. User triggers a run with an input payload via the API
3. The orchestrator reads the workflow definition, creates a `WorkflowRun` row and a `Task` row per node
4. It builds a dependency map from the edges and dispatches tasks with no dependencies into their agent queues
5. An agent worker picks up the job, executes it, updates the task status in Postgres, and returns the result
6. BullMQ fires a `completed` event which the orchestrator's `QueueEvents` listener catches
7. The orchestrator checks which tasks are now unblocked, takes the completed task's output as the next task's input, and dispatches those tasks
8. This continues until all tasks complete, at which point the run is marked `COMPLETED`
9. Throughout execution, the orchestrator emits events on the `RunEmitter` which the SSE endpoint streams to the browser

---

### Q: How does dependency resolution work?

When a run is triggered, the orchestrator builds an adjacency map from the workflow's edges array. For each node it finds all incoming edges — those source nodes are its dependencies.

For example given edges `[{source: A, target: B}, {source: A, target: C}, {source: B, target: D}, {source: C, target: D}]`:
- Node A has no dependencies — dispatched immediately
- Nodes B and C depend on A — dispatched when A completes
- Node D depends on both B and C — dispatched only when both complete

This enables **parallel execution** — B and C run simultaneously. The check before dispatching any task is: "are all task IDs in this task's `dependsOn` array in a `COMPLETED` status?" If yes, dispatch. If no, wait.

---

### Q: How would you scale this system to handle 10,000 concurrent workflow runs?

Several dimensions:

**Workers** — each agent worker is a stateless process. Scale horizontally by running more worker instances. BullMQ handles distribution automatically — multiple workers pull from the same named queue and BullMQ ensures each job is processed by exactly one worker.

**Orchestrator** — currently a single process. To scale, use Redis distributed locks to ensure only one orchestrator instance processes a given run's events at a time. Or partition runs across orchestrator instances by `runId`.

**Database** — add read replicas for the dashboard and list queries. The write path (task status updates) stays on the primary. Add indexes on `runId`, `status`, and `workflowId`.

**Redis** — use Redis Cluster for horizontal scaling of the queue. BullMQ supports this natively.

**SSE** — SSE connections are stateful and held on a single server. Use a pub/sub system like Redis Pub/Sub to broadcast events across multiple API server instances so any server can push to any connected client.

---

### Q: What happens if a worker crashes mid-task?

BullMQ handles this with a **lock mechanism**. When a worker picks up a job it acquires a lock with a TTL (time-to-live). The worker must renew this lock while processing. If the worker crashes the lock expires and BullMQ automatically makes the job available for another worker to pick up. The job is retried up to `maxAttempts` times with exponential backoff. This is why `maxRetriesPerRequest: null` is set on the ioredis connection — BullMQ needs to block waiting for lock renewal indefinitely.

---

## Backend & Architecture Questions

### Q: Why did you choose Express over NestJS or Fastify?

For this project Express was the right choice for three reasons. First, Express is maximally documented — every problem has a solution on Stack Overflow. Second, NestJS adds significant boilerplate (decorators, modules, dependency injection containers) that slows down solo development without proportional benefit. Third, Fastify would have been faster in terms of raw throughput but the bottleneck in this system is LLM API calls and database queries, not the HTTP framework itself. The tradeoff is that Express requires more discipline to structure cleanly — which is why the modular controller/service/repository pattern was applied manually.

---

### Q: Explain the controller/service/repository pattern you used.

Three layers, each with a single responsibility:

**Repository** — talks to the database only. No business logic. Methods like `findById`, `findAll`, `create`, `update`. Takes `PrismaClient` via constructor injection. This makes it independently testable with a mock database.

**Service** — business logic only. Validates inputs, calls the repository, calls external systems like the orchestrator. Never touches Express objects like `req` or `res`. Throws typed errors (`NotFoundError`, `ValidationError`) that bubble up.

**Controller** — HTTP concerns only. Reads from `req`, calls the service, sends `res`. Catches service errors with try/catch and passes them to `next(error)` for the global error handler. Thin as possible.

This separation means you can test business logic without spinning up an HTTP server, and change the HTTP framework without touching business logic.

---

### Q: How does your error handling work?

A custom `ApiError` base class carries three fields — `message`, `statusCode`, and `errorCode`. Subclasses like `NotFoundError`, `ValidationError`, and `ConflictError` set these automatically.

Services throw typed errors. Controllers catch them with try/catch and pass to `next(error)`. A global error middleware at the end of the Express middleware chain catches everything — if the error is an `ApiError` it responds with the correct status code, if it's an unknown error it responds with 500.

This means error handling logic lives in one place, response shapes are consistent, and the frontend can always check `errorCode` to decide what to show the user.

---

### Q: Why is the base agent class abstract?

The base agent handles all the boilerplate that every agent shares — connecting to the queue, picking up jobs, updating task status in the database, heartbeat, graceful shutdown. Individual agents only implement `execute(input, config)` — pure business logic with no knowledge of queues or databases.

This is the **Template Method pattern**. The abstract base defines the algorithm skeleton (pick up job → mark running → execute → mark completed/failed) and delegates the variable step (`execute`) to subclasses. Adding a new agent type means extending `BaseAgent` and implementing one method. The orchestrator and queue system need zero changes.

---

### Q: What is a heartbeat and why does your system need one?

Every 30 seconds each agent updates its `lastSeenAt` timestamp in the database. This is the heartbeat. The dashboard uses this to determine if an agent is alive — if `lastSeenAt` is more than 60 seconds ago the agent is considered offline even if its `status` column still says `ONLINE`.

This is necessary because an agent process can crash without calling its `stop()` method, which means the database status never gets updated to `OFFLINE`. Without a heartbeat there is no way to detect a crashed agent from the outside. This pattern is called a **liveness check** and is standard in distributed systems.

---

## Queue & Distributed Systems Questions

### Q: Why BullMQ over RabbitMQ or Kafka?

**vs RabbitMQ** — RabbitMQ is a more powerful message broker with the AMQP protocol, better for enterprise messaging. But it requires a separate server, more complex configuration, and the Node.js client is less ergonomic. For a task queue with retries and job state tracking, BullMQ is purpose-built and simpler.

**vs Kafka** — Kafka is designed for high-throughput event streaming and immutable logs. It would be overkill here and would require significant operational overhead (Zookeeper or KRaft, consumer group management, partition strategy). BullMQ covers all the requirements — retries, delays, priorities, dead-letter queues, job state.

The key insight: BullMQ is a **task queue** (execute this job once, confirm it's done), Kafka is an **event log** (this event happened, any consumer can replay it). The use case here is task distribution, not event streaming.

---

### Q: What is exponential backoff and why did you implement it?

Exponential backoff means each retry waits longer than the previous one. With a base delay of 1000ms and 3 attempts: first retry waits 1s, second waits 2s, third waits 4s.

The reason is to avoid **thundering herd** — if 100 jobs fail simultaneously and all retry immediately they hammer the downstream service at the same moment, likely causing it to fail again. With backoff the retries spread out over time giving the downstream service a chance to recover.

BullMQ implements this natively with `backoff: { type: "exponential", delay: 1000 }`.

---

### Q: What is a dead-letter queue?

A dead-letter queue (DLQ) is where jobs go after exhausting all retry attempts. BullMQ calls this the "failed" set. Jobs in the failed set aren't retried automatically but can be inspected, manually retried, or deleted.

In Quelm when a task fails all attempts the task row is marked `FAILED` in Postgres, and if it was a critical task the entire run is marked `FAILED`. The failed job sits in BullMQ's failed set for inspection via BullMQ Board.

---

### Q: Why is `maxRetriesPerRequest: null` set on the ioredis connection?

BullMQ uses blocking Redis commands like `BLPOP` to wait for jobs. By default ioredis throws an error if a command doesn't get a response within a certain number of retries. Setting `maxRetriesPerRequest: null` tells ioredis to wait indefinitely — which is required for BullMQ workers to function correctly in a long-running process.

---

### Q: What is the difference between a Queue and a Worker in BullMQ?

A **Queue** is the producer side — it adds jobs and provides metadata about the queue (job counts, job details). It doesn't process anything.

A **Worker** is the consumer side — it pulls jobs from a named queue and processes them with a processor function. Multiple workers can listen to the same queue name and BullMQ distributes jobs across them.

**QueueEvents** is a third concept — it subscribes to events emitted by workers (completed, failed, progress) without processing jobs itself. The orchestrator uses `QueueEvents` to know when tasks complete so it can dispatch the next ones.

---

### Q: How do you prevent a task from being processed twice?

BullMQ uses Redis atomic operations and locks. When a worker picks up a job it acquires an exclusive lock using `SET NX` (set if not exists). Other workers see the lock and skip the job. The lock has a TTL that the worker renews while processing. This guarantees **at-least-once delivery** — in the rare case of a network partition a job could be processed twice, but the task database update uses `UPDATE WHERE id = ?` which is idempotent for status changes.

---

## Database & ORM Questions

### Q: Why PostgreSQL over MongoDB for this project?

Workflow runs have clear relational structure — a run belongs to a workflow definition, tasks belong to a run. These relationships benefit from foreign key constraints and ACID transactions. When updating task status the system needs to ensure either the task is marked completed AND the agent counter is incremented, or neither happens. That's a transaction.

MongoDB's flexible schema seemed appealing for storing workflow definitions (arbitrary JSON graphs), but Postgres handles this with `Json` columns. You get relational structure where it matters and JSON flexibility where it doesn't.

---

### Q: What is the N+1 query problem and did you encounter it?

The N+1 problem is when you fetch a list of N records and then make N additional queries to fetch related data for each one — N+1 queries total instead of 1 or 2.

In Quelm this was a potential issue in the runs list — fetching 20 runs and then fetching the workflow name for each one would be 21 queries. It was solved by using Prisma's `include` — `include: { workflow: true, tasks: true }` — which generates a single SQL JOIN query returning all data at once.

---

### Q: Why did you use cuid over uuid?

Both are unique identifiers. cuid starts with a timestamp component making it naturally sortable by creation time — useful for runs and tasks where you often want "most recent first". It's also slightly more collision-resistant in distributed systems and URL-friendly. The tradeoff is cuid is less universally standardized than uuid, but for an application database either works fine.

---

### Q: What is Prisma's `upsert` and where did you use it?

`upsert` is "update if exists, create if not". It takes a `where` clause, a `create` payload, and an `update` payload. If the record matching `where` exists it runs `update`, otherwise it runs `create` — atomically.

In Quelm it's used when an agent starts up — either register a new agent row or update the existing one's status to ONLINE. Without upsert you'd need to `findUnique` first, then `create` or `update` depending on the result — two round trips with a race condition window between them.

---

## Frontend Questions

### Q: Why Next.js over Vite + React?

Next.js provides API routes, server-side rendering, and the App Router file-based routing system in one package. The key benefit here is keeping sensitive things server-side — Groq API keys, database URLs. With Vite everything runs client-side. Next.js also deploys to Vercel with zero configuration and a global CDN automatically. The tradeoff is Next.js has more opinions and a steeper learning curve than Vite.

---

### Q: Why shadcn/ui over Material UI or Chakra?

shadcn/ui copies component source code directly into your repository rather than being a node_modules dependency. This means you own the components — you can modify them freely without fighting the library. MUI and Chakra are black boxes where customization requires overriding styles in non-obvious ways. shadcn is built on Radix UI primitives which are fully accessible by default. The tradeoff is a slightly longer initial setup and more files in your repository.

---

### Q: How does React Flow work and how did you customize it?

React Flow is a library for building node-based editors. It manages the canvas, drag and drop, node positions, edge connections, zoom, and pan. You provide custom node components and it handles the rest.

In Quelm custom `AgentNode` components were built that render the agent type, name, config preview, and status indicator. React Flow provides `Handle` components for the connection points. The node types are registered in a `nodeTypes` map passed to the `ReactFlow` component. For the run monitor the canvas is set to `nodesDraggable: false` and `nodesConnectable: false` to make it read-only.

---

### Q: How does TanStack Query help and what would happen without it?

TanStack Query handles server state — fetching, caching, background refetching, and cache invalidation. Without it you'd manually manage loading states, error states, and cache with `useEffect` and `useState`. The key feature used here is `invalidateQueries` — when a workflow is created via `useCreateWorkflow`, the mutation's `onSuccess` callback invalidates the `["workflows"]` cache key, automatically triggering a refetch of the workflows list. `refetchInterval: 30000` on dashboard queries means the stats auto-refresh every 30 seconds without any manual polling logic.

---

## Real-time & SSE Questions

### Q: Why SSE over WebSockets for the run monitor?

The run monitor is **unidirectional** — the server pushes task status updates to the browser. The browser never sends data back through the same channel. WebSockets are bidirectional and are the right choice when both sides need to send messages (chat apps, collaborative editing, multiplayer games).

SSE is simpler — it's a regular HTTP connection that stays open, uses the browser's built-in `EventSource` API, and automatically reconnects on disconnect. No extra libraries needed on the client. The tradeoff is SSE is HTTP/1.1 only per connection (HTTP/2 multiplexes), but for this use case one SSE connection per run monitor page is perfectly fine.

---

### Q: How does the RunEmitter work?

`RunEmitter` is a Node.js `EventEmitter` singleton. The orchestrator imports it and emits events when tasks change status: `runEmitter.emit('run:${runId}', { taskId, status })`. The SSE endpoint also imports the same singleton and attaches a listener for `run:${runId}` events. When the orchestrator emits, the SSE handler receives it and writes the event to the open HTTP response.

The key constraint is this only works within a single Node.js process. If the system scaled to multiple API server instances the RunEmitter would need to be replaced with Redis Pub/Sub — any server instance could receive the SSE connection but only the instance running the orchestrator would emit events. Redis Pub/Sub broadcasts across all instances.

---

### Q: What happens when the SSE client disconnects?

The `req.on('close')` handler fires. It calls `runEmitter.off('run:${runId}', eventListener)` to remove the listener and `res.end()` to close the response. Without this cleanup the emitter would hold a reference to the listener forever — a **memory leak**. Every disconnected client that wasn't cleaned up would add another dead listener to the emitter, eventually causing memory exhaustion.

---

## AI & Agent Questions

### Q: Why Groq over OpenAI or Anthropic for agent LLM calls?

Three reasons: Groq has the most generous free tier of any LLM provider, making this project free to run. Groq's inference speed is significantly faster than other providers — important for multi-agent pipelines where you chain LLM calls. Groq's API is OpenAI-compatible, meaning switching providers later requires changing one line — the base URL. The tradeoff is Groq's model selection is smaller than OpenAI's, and the models (LLaMA 3.3, Mixtral) are slightly less capable than GPT-4o for complex reasoning tasks.

---

### Q: How does prompt template interpolation work?

The `interpolateTemplate` function takes a template string and a variables object. It uses a regex `/\{\{(.*?)\}\}/g` to find all `{{variable}}` placeholders, trims whitespace around the key name, looks up the value in the variables object, and replaces the placeholder with the value. If a variable isn't found it replaces with an empty string rather than leaving the placeholder in the prompt. This means `"Research {{company_name}}"` with `{ company_name: "Anthropic" }` becomes `"Research Anthropic"`.

---

### Q: What is the BaseAgent pattern and why is it important?

The BaseAgent is an abstract class implementing the **Template Method pattern**. It defines the complete job processing algorithm — pick up job from queue, mark task running in database, call `execute()`, mark task completed or failed, update agent metrics, emit heartbeat. Individual agents only override `execute()`.

This is important for three reasons. First, it ensures every agent handles database updates, retries, and error reporting consistently — you can't forget to update task status in a new agent implementation. Second, adding a new agent type is safe — you can't accidentally break the orchestration flow. Third, the base class is the only place where BullMQ and Prisma interact with each other — agents are pure functions of their input.

---

## DevOps & Infrastructure Questions

### Q: What is Docker Compose and why do you use it only for infrastructure?

Docker Compose is a tool for defining and running multi-container applications. It's used here to run Postgres and Redis locally with a single `docker compose up -d` command — no manual installation, consistent versions, data persisted in named volumes.

The Node.js server runs locally via `ts-node-dev` rather than in Docker because Docker would require rebuilding the image on every code change. `ts-node-dev` restarts in under a second. Docker is for infrastructure that doesn't change during development, not for application code.

---

### Q: What is pnpm and why use it over npm?

pnpm uses a content-addressable global store — packages are stored once and hard-linked into `node_modules` rather than copied. This makes installs faster after the first one and uses less disk space. More importantly pnpm enforces strict dependency isolation — you can only import packages declared in your own `package.json`. npm and yarn use a flat `node_modules` structure where you can accidentally use a transitive dependency you never declared (phantom dependencies). pnpm workspaces also handle monorepo setups cleanly without needing Turborepo.

---

### Q: What is a monorepo and why is your project structured as one?

A monorepo is a single repository containing multiple related packages or applications. Quelm has `client/` and `server/` as separate packages in one repo. The benefits are shared tooling (one ESLint config, one Prettier config, one TypeScript base config), atomic commits across frontend and backend, and a single `git clone` to get everything. The tradeoff is slightly more complex build configuration and larger repository size over time.

---

## Key Terminology

**Orchestrator** — the process responsible for managing workflow state, dispatching tasks, and handling completion events. It knows the workflow graph but doesn't execute tasks itself.

**Agent/Worker** — a process that pulls tasks from a queue and executes them. It knows nothing about the overall workflow, only its specific task.

**Dead-letter queue** — where permanently failed jobs go after exhausting retries. Used for inspection and manual intervention.

**Exponential backoff** — retry strategy where each attempt waits twice as long as the previous one, preventing thundering herd on downstream services.

**Idempotency** — an operation that produces the same result whether executed once or multiple times. Critical in distributed systems where operations may be retried.

**At-least-once delivery** — a guarantee that a message will be delivered at least once, possibly more. Contrasted with at-most-once (may be lost) and exactly-once (delivered precisely once, very hard to achieve).

**Fan-out** — one task triggering multiple parallel downstream tasks. Enabled by the dependency graph where multiple nodes can have the same source node as a dependency.

**Dependency resolution** — determining the execution order of tasks based on their declared dependencies. Quelm uses an adjacency map built from the workflow's edges array.

**Heartbeat** — a periodic signal from a worker to the database confirming it's still alive. Used to detect crashed workers.

**SSE (Server-Sent Events)** — a protocol for server-to-client streaming over HTTP. The server holds the connection open and pushes events as they occur.

**Template Method pattern** — a design pattern where a base class defines the skeleton of an algorithm and delegates specific steps to subclasses. Used in BaseAgent.

**Dependency injection** — passing dependencies (like PrismaClient) via constructor rather than importing them directly. Makes code testable and loosely coupled.

**Content-addressable store** — storage where items are referenced by their content hash rather than a file path. Used by pnpm for package deduplication.

**Compound unique constraint** — a database constraint ensuring the combination of two or more fields is unique. Used on Agent `(name, type)` to allow multiple agent types but prevent duplicate instances.

---

## Key Tradeoffs Made

| Decision | Chosen | Alternative | Reason |
|---|---|---|---|
| Queue system | BullMQ | Kafka, RabbitMQ | Right tool for task distribution, not event streaming |
| Language | TypeScript | JavaScript, Python | End-to-end type safety, single language |
| Frontend framework | Next.js | Vite + React | API routes, SSR, Vercel deployment |
| UI components | shadcn/ui | MUI, Chakra | Own the components, no black box dependency |
| Real-time | SSE | WebSockets | Unidirectional use case, simpler implementation |
| ORM | Prisma | Drizzle, TypeORM | Cleaner migrations, better DX, larger community |
| Database | PostgreSQL | MongoDB | Relational structure + JSON columns covers both needs |
| LLM provider | Groq | OpenAI, Anthropic | Free tier, fastest inference, OpenAI-compatible |
| Package manager | pnpm | npm, yarn | Strict isolation, faster, better workspaces |
| Agent architecture | Abstract class | Functions, plugins | Stateful lifecycle (start/stop/heartbeat) suits classes |
| Error handling | Global middleware | Per-route try/catch | Single source of truth, consistent response shape |
| Orchestrator events | QueueEvents | Database polling | Event-driven is lower latency and lower database load |
| Node positions | Calculated linearly | Auto-layout algorithm | Simpler for MVP, auto-layout can be added later |

---

## Behavioural Questions

### Q: What was the hardest technical problem you solved in this project?

The dependency resolution in the orchestrator. When multiple tasks complete in parallel, the system needs to determine in real time which downstream tasks are now unblocked — meaning all their dependencies are completed. The naive approach of re-fetching all task statuses and re-checking the full graph on every completion event is both correct and inefficient at scale.

The implementation uses a Set of completed task IDs for O(1) lookup and filters the pending task list in a single pass. The subtler challenge was the two-pass task creation — tasks need to be created before their IDs are known to populate the `dependsOn` field, so the system creates all tasks first with empty `dependsOn`, builds a node-to-task-ID map, then updates each task's `dependsOn` with real database IDs in a second pass.

---

### Q: What would you change if you were starting over?

Two things. First, I would separate the orchestrator into its own process from the start rather than running it alongside the API server. This would make horizontal scaling cleaner and the failure domain smaller. Second, I would use Zod for input validation at the API boundary rather than manual if/throw checks in service methods. Zod gives you runtime validation and TypeScript types from a single schema definition, which reduces duplication.

---

### Q: How would you add authentication to this system?

JWT with refresh tokens. Each user gets an access token (short-lived, 15 minutes) and a refresh token (long-lived, 7 days). The access token is sent in the `Authorization` header on every request. An Express middleware validates the JWT and attaches the user to `req.user`.

Workflows and runs would get a `userId` foreign key. All queries would filter by `userId` to enforce ownership — a user can only see and trigger their own workflows. The `WorkflowDefinition` and `WorkflowRun` Prisma models already have placeholder fields ready for this. The frontend would store the refresh token in an httpOnly cookie and the access token in memory.

---

### Q: Did you use AI to build this? How do you feel about that?

Yes, I used Claude as a pair programmer throughout the project. It explained concepts before I wrote code, reviewed what I wrote, and helped me debug issues. But I wrote the code, made the architectural decisions, and I can explain every part of the system.

Using AI as a learning tool is equivalent to using documentation, Stack Overflow, or a senior engineer's guidance. What matters is whether you understand what you built. I can whiteboard the orchestrator loop, explain why BullMQ was chosen over Kafka, and describe what happens to a task when a worker crashes. The project is mine.
