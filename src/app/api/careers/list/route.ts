import { NextResponse } from 'next/server';
import { getOpenVacancies } from '@/lib/careers';

// Public list of open vacancies, consumed by the static careers page on
// allonelabs.com (same-origin via the /api/careers/* proxy).
export const revalidate = 60;

export async function GET() {
  const vacancies = await getOpenVacancies();
  return NextResponse.json(
    { vacancies },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
