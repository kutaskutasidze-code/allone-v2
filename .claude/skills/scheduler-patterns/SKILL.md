---
name: scheduler-patterns
description: Patterns for scheduled tasks, cron jobs, and recurring automation in Node.js/Next.js applications. Use when building automated workflows, periodic data sync, or scheduled notifications.
---

# Scheduler Patterns

## Overview

This skill covers:
- Cron job syntax and scheduling
- Vercel Cron for serverless
- Node-cron for self-hosted
- BullMQ repeatable jobs
- Task scheduling best practices

---

## Pattern 1: Vercel Cron Jobs (Serverless)

### Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/hourly-sync",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/weekly-cleanup",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

### Cron API Route

```typescript
// app/api/cron/daily-report/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret (Vercel adds this header)
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Your scheduled task logic
    await generateDailyReport();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Job failed' },
      { status: 500 }
    );
  }
}

async function generateDailyReport() {
  // Your report generation logic
  console.log('Generating daily report...');
}
```

### Environment Setup

```env
# .env.local
CRON_SECRET=your-secure-random-string
```

---

## Pattern 2: Node-Cron (Self-Hosted)

### Installation

```bash
npm install node-cron
```

### Scheduler Service

```typescript
// lib/scheduler/index.ts
import cron from 'node-cron';

interface ScheduledTask {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  options?: {
    timezone?: string;
    runOnInit?: boolean;
  };
}

class Scheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  register(task: ScheduledTask) {
    if (this.tasks.has(task.name)) {
      console.warn(`Task ${task.name} already registered, replacing...`);
      this.tasks.get(task.name)?.stop();
    }

    const cronTask = cron.schedule(
      task.schedule,
      async () => {
        const startTime = Date.now();
        console.log(`[${task.name}] Starting...`);

        try {
          await task.handler();
          console.log(
            `[${task.name}] Completed in ${Date.now() - startTime}ms`
          );
        } catch (error) {
          console.error(`[${task.name}] Failed:`, error);
          // You might want to send alerts here
        }
      },
      {
        timezone: task.options?.timezone ?? 'UTC',
        runOnInit: task.options?.runOnInit ?? false,
      }
    );

    this.tasks.set(task.name, cronTask);
    console.log(`Registered task: ${task.name} (${task.schedule})`);
  }

  start(name: string) {
    const task = this.tasks.get(name);
    if (task) {
      task.start();
      console.log(`Started task: ${name}`);
    }
  }

  stop(name: string) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      console.log(`Stopped task: ${name}`);
    }
  }

  stopAll() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
  }

  listTasks() {
    return Array.from(this.tasks.keys());
  }
}

export const scheduler = new Scheduler();
```

### Define Tasks

```typescript
// lib/scheduler/tasks/index.ts
import { scheduler } from '../index';
import { dailyReportTask } from './daily-report';
import { syncDataTask } from './sync-data';
import { cleanupTask } from './cleanup';
import { healthCheckTask } from './health-check';

export function registerAllTasks() {
  // Daily report at 9 AM UTC
  scheduler.register({
    name: 'daily-report',
    schedule: '0 9 * * *',
    handler: dailyReportTask,
  });

  // Sync data every hour
  scheduler.register({
    name: 'sync-data',
    schedule: '0 * * * *',
    handler: syncDataTask,
  });

  // Cleanup old data every Sunday at midnight
  scheduler.register({
    name: 'weekly-cleanup',
    schedule: '0 0 * * 0',
    handler: cleanupTask,
  });

  // Health check every 5 minutes
  scheduler.register({
    name: 'health-check',
    schedule: '*/5 * * * *',
    handler: healthCheckTask,
  });
}
```

### Individual Task Files

```typescript
// lib/scheduler/tasks/daily-report.ts
import { createClient } from '@/lib/supabase/admin';

export async function dailyReportTask() {
  const supabase = createClient();

  // Get yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: stats } = await supabase
    .from('analytics')
    .select('*')
    .gte('created_at', yesterday.toISOString());

  // Generate report
  const report = {
    date: yesterday.toISOString().split('T')[0],
    totalEvents: stats?.length ?? 0,
    // Add more metrics
  };

  // Store report
  await supabase.from('daily_reports').insert(report);

  // Optionally send email
  // await sendReportEmail(report);

  console.log('Daily report generated:', report);
}
```

```typescript
// lib/scheduler/tasks/cleanup.ts
import { createClient } from '@/lib/supabase/admin';

export async function cleanupTask() {
  const supabase = createClient();

  // Delete old logs (> 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: deletedLogs } = await supabase
    .from('logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select('*', { count: 'exact', head: true });

  // Delete old webhook events (> 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: deletedWebhooks } = await supabase
    .from('webhook_events')
    .delete()
    .lt('processed_at', sevenDaysAgo.toISOString())
    .select('*', { count: 'exact', head: true });

  console.log(`Cleanup: ${deletedLogs} logs, ${deletedWebhooks} webhook events deleted`);
}
```

### Start Scheduler

```typescript
// scripts/start-scheduler.ts
import { registerAllTasks } from '../lib/scheduler/tasks';

console.log('Starting scheduler...');
registerAllTasks();
console.log('Scheduler started. Press Ctrl+C to stop.');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down scheduler...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down scheduler...');
  process.exit(0);
});
```

---

## Pattern 3: BullMQ Repeatable Jobs

Better for distributed systems (see queue-patterns skill):

```typescript
// lib/scheduler/bullmq-scheduler.ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

const scheduledQueue = new Queue('scheduled-tasks', { connection });

export async function setupScheduledJobs() {
  // Clear existing repeatable jobs first
  const existingJobs = await scheduledQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await scheduledQueue.removeRepeatableByKey(job.key);
  }

  // Daily report at 9 AM
  await scheduledQueue.add(
    'daily-report',
    { type: 'daily-report' },
    {
      repeat: {
        pattern: '0 9 * * *',
        tz: 'UTC',
      },
      jobId: 'daily-report',
    }
  );

  // Hourly sync
  await scheduledQueue.add(
    'hourly-sync',
    { type: 'sync' },
    {
      repeat: {
        every: 60 * 60 * 1000, // Every hour in ms
      },
      jobId: 'hourly-sync',
    }
  );

  // Every 5 minutes
  await scheduledQueue.add(
    'health-check',
    { type: 'health-check' },
    {
      repeat: {
        every: 5 * 60 * 1000,
      },
      jobId: 'health-check',
    }
  );

  console.log('Scheduled jobs registered');
}
```

---

## Pattern 4: Cron Syntax Reference

```
┌────────────── minute (0-59)
│ ┌──────────── hour (0-23)
│ │ ┌────────── day of month (1-31)
│ │ │ ┌──────── month (1-12)
│ │ │ │ ┌────── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

### Common Schedules

| Schedule | Cron Expression | Description |
|----------|-----------------|-------------|
| Every minute | `* * * * *` | Runs every minute |
| Every 5 minutes | `*/5 * * * *` | 0, 5, 10, 15... |
| Every hour | `0 * * * *` | At minute 0 |
| Every day at midnight | `0 0 * * *` | 00:00 daily |
| Every day at 9 AM | `0 9 * * *` | 09:00 daily |
| Every Monday | `0 0 * * 1` | Monday at midnight |
| Every weekday | `0 9 * * 1-5` | Mon-Fri at 9 AM |
| First of month | `0 0 1 * *` | 1st at midnight |
| Every 15 minutes | `*/15 * * * *` | 0, 15, 30, 45 |
| Twice daily | `0 9,18 * * *` | 9 AM and 6 PM |

### Vercel Cron Limits

| Plan | Limit |
|------|-------|
| Hobby | 2 cron jobs, daily max |
| Pro | 40 cron jobs, hourly min |
| Enterprise | Unlimited |

---

## Pattern 5: Monitoring & Logging

### Task Execution Logger

```typescript
// lib/scheduler/logger.ts
import { createClient } from '@/lib/supabase/admin';

interface TaskExecution {
  task_name: string;
  status: 'started' | 'completed' | 'failed';
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export async function logTaskExecution(execution: TaskExecution) {
  const supabase = createClient();

  await supabase.from('task_executions').insert({
    ...execution,
    executed_at: new Date().toISOString(),
  });
}

// Wrapper for tasks with automatic logging
export function withLogging(
  taskName: string,
  handler: () => Promise<void>
): () => Promise<void> {
  return async () => {
    const startTime = Date.now();

    await logTaskExecution({
      task_name: taskName,
      status: 'started',
    });

    try {
      await handler();

      await logTaskExecution({
        task_name: taskName,
        status: 'completed',
        duration_ms: Date.now() - startTime,
      });
    } catch (error) {
      await logTaskExecution({
        task_name: taskName,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error; // Re-throw for upstream handling
    }
  };
}

// Usage
scheduler.register({
  name: 'daily-report',
  schedule: '0 9 * * *',
  handler: withLogging('daily-report', dailyReportTask),
});
```

### Database Schema for Monitoring

```sql
-- Task execution logs
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_executions_name ON task_executions(task_name);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_time ON task_executions(executed_at DESC);

-- View for task health
CREATE VIEW task_health AS
SELECT
    task_name,
    COUNT(*) FILTER (WHERE status = 'completed') as success_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failure_count,
    AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
    MAX(executed_at) as last_run
FROM task_executions
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY task_name;
```

---

## Pattern 6: Distributed Locking

Prevent multiple instances from running same task:

```typescript
// lib/scheduler/lock.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function withLock<T>(
  lockKey: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T | null> {
  const lockValue = `${process.pid}-${Date.now()}`;

  // Try to acquire lock
  const acquired = await redis.set(
    `lock:${lockKey}`,
    lockValue,
    'EX',
    ttlSeconds,
    'NX'
  );

  if (!acquired) {
    console.log(`Lock ${lockKey} already held, skipping...`);
    return null;
  }

  try {
    return await fn();
  } finally {
    // Release lock (only if we still hold it)
    const currentValue = await redis.get(`lock:${lockKey}`);
    if (currentValue === lockValue) {
      await redis.del(`lock:${lockKey}`);
    }
  }
}

// Usage in task
export async function dailyReportTask() {
  const result = await withLock('daily-report', 300, async () => {
    // Only one instance runs this
    await generateReport();
    return { success: true };
  });

  if (!result) {
    console.log('Task skipped - another instance is running');
  }
}
```

---

## Pattern 7: Task Retry & Recovery

```typescript
// lib/scheduler/retry.ts

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, baseDelay: 1000, maxDelay: 30000 }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < options.maxRetries) {
        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt),
          options.maxDelay
        );
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage
scheduler.register({
  name: 'sync-data',
  schedule: '0 * * * *',
  handler: async () => {
    await withRetry(
      async () => {
        await syncExternalData();
      },
      { maxRetries: 3, baseDelay: 5000, maxDelay: 60000 }
    );
  },
});
```

---

## Best Practices

1. **Use UTC for cron schedules** - Avoid timezone confusion
2. **Implement idempotency** - Tasks may run twice
3. **Add distributed locking** - For multi-instance deployments
4. **Log everything** - Track executions and failures
5. **Set reasonable timeouts** - Prevent stuck tasks
6. **Handle failures gracefully** - Retry or alert
7. **Monitor task health** - Dashboard for visibility
8. **Keep tasks fast** - Use queues for long operations
9. **Test schedule expressions** - Use crontab.guru
10. **Document your schedules** - Team should know what runs when
