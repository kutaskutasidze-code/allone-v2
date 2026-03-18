import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Success response with data
 */
export function success<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Success response with pagination
 */
export function successWithPagination<T>(
  data: T[],
  pagination: PaginationMeta,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    { success: true, data, pagination },
    { status }
  );
}

/**
 * Generic error response
 * Note: Never expose internal error details to clients
 */
export function error(message: string, status: number = 500): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Validation error response from Zod
 */
export function validationError(zodError: ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string[]> = {};

  zodError.issues.forEach((issue) => {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 400 }
  );
}

/**
 * 401 Unauthorized response
 */
export function unauthorized(): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * 403 Forbidden response
 */
export function forbidden(): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403 }
  );
}

/**
 * 404 Not Found response
 */
export function notFound(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * 405 Method Not Allowed response
 */
export function methodNotAllowed(): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

/**
 * 409 Conflict response
 */
export function conflict(message: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message },
    { status: 409 }
  );
}

/**
 * 429 Rate Limited response
 */
export function rateLimited(): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}

/**
 * Parse pagination params from URL
 */
export function getPaginationParams(url: string): { page: number; limit: number; offset: number } {
  const { searchParams } = new URL(url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number | null
): PaginationMeta {
  const totalCount = total ?? 0;
  return {
    page,
    limit,
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}
