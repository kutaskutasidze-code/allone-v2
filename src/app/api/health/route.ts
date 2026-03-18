import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns the current status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now();

  const health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
      database: {
        status: 'up' | 'down';
        latency?: number;
        error?: string;
      };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'down',
      },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const supabase = await createClient();

    // Simple query to test connection
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const dbLatency = Date.now() - dbStart;

    if (error) {
      health.checks.database = {
        status: 'down',
        latency: dbLatency,
        error: 'Query failed',
      };
      health.status = 'degraded';
    } else {
      health.checks.database = {
        status: 'up',
        latency: dbLatency,
      };
    }
  } catch (err) {
    health.checks.database = {
      status: 'down',
      error: 'Connection failed',
    };
    health.status = 'unhealthy';
  }

  // Determine HTTP status code
  const httpStatus = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: httpStatus });
}
