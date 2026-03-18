---
name: queue-patterns
description: Job queue patterns using BullMQ for background tasks, scheduled jobs, and async processing. Use when building automation workflows, email queues, or any deferred processing.
---

# Queue Patterns with BullMQ

## Overview

BullMQ is a Redis-based queue for Node.js. Use it for:
- Background job processing
- Scheduled/recurring tasks
- Rate-limited operations
- Retry logic with backoff
- Job prioritization

## Installation

```bash
npm install bullmq ioredis
```

## Environment Setup

```env
# .env
REDIS_URL=redis://localhost:6379
# Or for Upstash (serverless Redis)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

---

## Pattern 1: Basic Queue Setup

### Queue Configuration

```typescript
// lib/queue/config.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Reusable Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue factory
export function createQueue<T>(name: string) {
  return new Queue<T>(name, { connection });
}

// Worker factory
export function createWorker<T>(
  name: string,
  processor: (job: { data: T; id?: string }) => Promise<unknown>
) {
  return new Worker<T>(name, processor, {
    connection,
    concurrency: 5,
  });
}

// Queue events for monitoring
export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}
```

### Define a Queue

```typescript
// lib/queue/email-queue.ts
import { createQueue, createWorker, createQueueEvents } from './config';
import { Resend } from 'resend';

interface EmailJob {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: Record<string, unknown>;
}

// Create queue
export const emailQueue = createQueue<EmailJob>('email');

// Create worker
const resend = new Resend(process.env.RESEND_API_KEY);

export const emailWorker = createWorker<EmailJob>('email', async (job) => {
  const { to, subject, body } = job.data;

  console.log(`Processing email job ${job.id} to ${to}`);

  try {
    const result = await resend.emails.send({
      from: 'noreply@your-domain.com',
      to,
      subject,
      html: body,
    });

    console.log(`Email sent: ${result.data?.id}`);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error(`Email failed: ${error}`);
    throw error; // Will trigger retry
  }
});

// Event listeners
const emailEvents = createQueueEvents('email');

emailEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} completed:`, returnvalue);
});

emailEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed:`, failedReason);
});
```

### Add Jobs to Queue

```typescript
// Usage in API routes or services
import { emailQueue } from '@/lib/queue/email-queue';

// Add single job
await emailQueue.add('send-welcome', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: '<h1>Welcome to our platform</h1>',
});

// Add job with options
await emailQueue.add(
  'send-notification',
  {
    to: 'user@example.com',
    subject: 'New message',
    body: 'You have a new message',
  },
  {
    delay: 5000, // Wait 5 seconds before processing
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second, then 2, 4, 8...
    },
    priority: 1, // Lower = higher priority
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs
  }
);

// Add bulk jobs
await emailQueue.addBulk([
  { name: 'email-1', data: { to: 'a@b.com', subject: 'Hi', body: '...' } },
  { name: 'email-2', data: { to: 'c@d.com', subject: 'Hi', body: '...' } },
]);
```

---

## Pattern 2: Scheduled/Recurring Jobs

### Cron-like Scheduling

```typescript
// lib/queue/scheduled-jobs.ts
import { createQueue, createWorker } from './config';

interface ScheduledJob {
  type: 'daily-report' | 'cleanup' | 'sync';
  params?: Record<string, unknown>;
}

export const scheduledQueue = createQueue<ScheduledJob>('scheduled');

// Add recurring jobs
export async function setupScheduledJobs() {
  // Daily report at 9 AM
  await scheduledQueue.add(
    'daily-report',
    { type: 'daily-report' },
    {
      repeat: {
        pattern: '0 9 * * *', // Cron syntax
        tz: 'America/New_York',
      },
    }
  );

  // Cleanup every hour
  await scheduledQueue.add(
    'cleanup',
    { type: 'cleanup' },
    {
      repeat: {
        every: 60 * 60 * 1000, // Every hour in ms
      },
    }
  );

  // Sync every 15 minutes
  await scheduledQueue.add(
    'sync',
    { type: 'sync' },
    {
      repeat: {
        pattern: '*/15 * * * *',
      },
    }
  );
}

// Worker to process scheduled jobs
export const scheduledWorker = createWorker<ScheduledJob>(
  'scheduled',
  async (job) => {
    switch (job.data.type) {
      case 'daily-report':
        return await generateDailyReport();
      case 'cleanup':
        return await runCleanup();
      case 'sync':
        return await syncData();
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  }
);

async function generateDailyReport() {
  console.log('Generating daily report...');
  // Your report logic
}

async function runCleanup() {
  console.log('Running cleanup...');
  // Your cleanup logic
}

async function syncData() {
  console.log('Syncing data...');
  // Your sync logic
}
```

### Managing Repeatable Jobs

```typescript
// List all repeatable jobs
const repeatableJobs = await scheduledQueue.getRepeatableJobs();
console.log(repeatableJobs);

// Remove a repeatable job
await scheduledQueue.removeRepeatableByKey(repeatableJobs[0].key);

// Remove all repeatable jobs
for (const job of repeatableJobs) {
  await scheduledQueue.removeRepeatableByKey(job.key);
}
```

---

## Pattern 3: Rate-Limited Queue

### Rate Limiter Configuration

```typescript
// lib/queue/rate-limited-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

interface ApiCallJob {
  endpoint: string;
  method: 'GET' | 'POST';
  data?: unknown;
}

// Queue with rate limiting
export const apiQueue = new Queue<ApiCallJob>('api-calls', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Worker with concurrency and rate limiting
export const apiWorker = new Worker<ApiCallJob>(
  'api-calls',
  async (job) => {
    const { endpoint, method, data } = job.data;

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  },
  {
    connection,
    concurrency: 2, // Max 2 concurrent jobs
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second
    },
  }
);
```

### Custom Rate Limiter

```typescript
// lib/queue/custom-rate-limiter.ts
import { RateLimiter } from 'bullmq';

// Different rate limits per job type
export class CustomRateLimiter {
  private limiters: Map<string, { max: number; duration: number }>;

  constructor() {
    this.limiters = new Map([
      ['email', { max: 100, duration: 60000 }], // 100/minute
      ['sms', { max: 10, duration: 1000 }], // 10/second
      ['api', { max: 50, duration: 1000 }], // 50/second
    ]);
  }

  getLimiter(type: string) {
    return this.limiters.get(type) ?? { max: 100, duration: 1000 };
  }
}

// Usage in worker
const rateLimiter = new CustomRateLimiter();

const worker = new Worker(
  'mixed-queue',
  async (job) => {
    // Process based on job name/type
  },
  {
    connection,
    limiter: rateLimiter.getLimiter('email'),
  }
);
```

---

## Pattern 4: Job Progress & Events

### Progress Tracking

```typescript
// lib/queue/progress-queue.ts
import { createQueue, createWorker, createQueueEvents } from './config';

interface BatchJob {
  items: string[];
  operation: string;
}

export const batchQueue = createQueue<BatchJob>('batch');

export const batchWorker = createWorker<BatchJob>('batch', async (job) => {
  const { items, operation } = job.data;
  const results: unknown[] = [];

  for (let i = 0; i < items.length; i++) {
    // Process item
    const result = await processItem(items[i], operation);
    results.push(result);

    // Update progress (0-100)
    const progress = Math.round(((i + 1) / items.length) * 100);
    await job.updateProgress(progress);

    // Add log entry
    await job.log(`Processed item ${i + 1}/${items.length}`);
  }

  return { processed: results.length, results };
});

async function processItem(item: string, operation: string) {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  return { item, operation, status: 'done' };
}

// Monitor progress
const batchEvents = createQueueEvents('batch');

batchEvents.on('progress', ({ jobId, data }) => {
  console.log(`Job ${jobId} progress: ${data}%`);
});
```

### API Route for Job Status

```typescript
// app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import { batchQueue } from '@/lib/queue/progress-queue';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await batchQueue.getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const state = await job.getState();
  const progress = job.progress;
  const logs = await job.log;

  return NextResponse.json({
    id: job.id,
    state,
    progress,
    logs,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  });
}
```

---

## Pattern 5: Queue Dashboard (Bull Board)

### Installation

```bash
npm install @bull-board/api @bull-board/express express
```

### Setup Dashboard

```typescript
// lib/queue/dashboard.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';

import { emailQueue } from './email-queue';
import { scheduledQueue } from './scheduled-jobs';
import { batchQueue } from './progress-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(scheduledQueue),
    new BullMQAdapter(batchQueue),
  ],
  serverAdapter,
});

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

// Add auth middleware
app.use('/admin/queues', (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Implement your auth check
  if (!isAuthorized(authHeader)) {
    return res.status(401).send('Unauthorized');
  }
  next();
});

export { app as queueDashboard };
```

---

## Pattern 6: Flow (Parent-Child Jobs)

### Multi-Step Workflow

```typescript
// lib/queue/workflow.ts
import { FlowProducer, Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Define queues for each step
const validateQueue = new Queue('validate', { connection });
const processQueue = new Queue('process', { connection });
const notifyQueue = new Queue('notify', { connection });

// Flow producer
const flowProducer = new FlowProducer({ connection });

// Create a workflow
export async function startOrderWorkflow(orderId: string) {
  const flow = await flowProducer.add({
    name: 'notify-customer',
    queueName: 'notify',
    data: { orderId, type: 'order-complete' },
    children: [
      {
        name: 'process-order',
        queueName: 'process',
        data: { orderId },
        children: [
          {
            name: 'validate-order',
            queueName: 'validate',
            data: { orderId },
          },
        ],
      },
    ],
  });

  return flow;
}

// Workers for each step
const validateWorker = new Worker(
  'validate',
  async (job) => {
    console.log('Validating order:', job.data.orderId);
    // Validation logic
    return { valid: true };
  },
  { connection }
);

const processWorker = new Worker(
  'process',
  async (job) => {
    console.log('Processing order:', job.data.orderId);
    // Get result from child job
    const childrenValues = await job.getChildrenValues();
    console.log('Validation result:', childrenValues);
    // Processing logic
    return { processed: true };
  },
  { connection }
);

const notifyWorker = new Worker(
  'notify',
  async (job) => {
    console.log('Notifying customer:', job.data.orderId);
    const childrenValues = await job.getChildrenValues();
    console.log('Processing result:', childrenValues);
    // Send notification
    return { notified: true };
  },
  { connection }
);
```

---

## Pattern 7: Error Handling & Dead Letter Queue

```typescript
// lib/queue/error-handling.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Main queue
const mainQueue = new Queue('main', { connection });

// Dead letter queue for failed jobs
const deadLetterQueue = new Queue('dead-letter', { connection });

// Worker with error handling
const worker = new Worker(
  'main',
  async (job) => {
    try {
      // Your processing logic
      if (Math.random() > 0.7) {
        throw new Error('Random failure for demo');
      }
      return { success: true };
    } catch (error) {
      // Log error details
      await job.log(`Error: ${error.message}`);
      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection,
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        // Custom backoff: 1s, 5s, 30s, 2min, 10min
        const delays = [1000, 5000, 30000, 120000, 600000];
        return delays[Math.min(attemptsMade - 1, delays.length - 1)];
      },
    },
  }
);

// Move failed jobs to dead letter queue
const events = new QueueEvents('main', { connection });

events.on('failed', async ({ jobId, failedReason }) => {
  const job = await mainQueue.getJob(jobId);

  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    // Max retries reached, move to dead letter queue
    await deadLetterQueue.add('failed-job', {
      originalJob: job.data,
      failedReason,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade,
    });

    console.error(`Job ${jobId} moved to dead letter queue: ${failedReason}`);
  }
});

// Process dead letter queue (manual review or retry)
const dlqWorker = new Worker(
  'dead-letter',
  async (job) => {
    // Log for manual review or send alert
    console.log('Dead letter job:', job.data);
    // You could send to Slack, email, etc.
    return { logged: true };
  },
  { connection }
);
```

---

## Starting Workers

### Development

```typescript
// scripts/start-workers.ts
import './lib/queue/email-queue';
import './lib/queue/scheduled-jobs';
import './lib/queue/progress-queue';

console.log('Workers started');

// Keep process running
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  process.exit(0);
});
```

```bash
npx tsx scripts/start-workers.ts
```

### Production (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'queue-workers',
      script: 'dist/scripts/start-workers.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## Best Practices

1. **Always set `removeOnComplete`** - Prevent Redis memory bloat
2. **Use appropriate concurrency** - Match your resource limits
3. **Implement idempotency** - Jobs may run multiple times
4. **Set reasonable timeouts** - Prevent stuck jobs
5. **Monitor queue health** - Use Bull Board or custom metrics
6. **Handle graceful shutdown** - Close workers properly
7. **Use job priorities** - Critical jobs should process first
8. **Test retry logic** - Ensure backoff works as expected
