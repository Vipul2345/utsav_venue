import { NextResponse } from 'next/server';
import { getTopHalls } from '@/lib/services/rankingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const citySlug = searchParams.get('city') || undefined;
    const occasionSlug = searchParams.get('occasion') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;

    const topHalls = await getTopHalls({
      citySlug: citySlug === 'all' ? undefined : citySlug,
      occasionSlug: occasionSlug === 'all' ? undefined : occasionSlug,
      limit,
    });

    return NextResponse.json({ halls: topHalls });
  } catch (error: any) {
    console.error('Top halls error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch top halls' }, { status: 500 });
  }
}
