import { NextResponse } from 'next/server';
import { detectNearestCity } from '@/lib/services/locationService';

export async function GET(request: Request) {
  return handleDetect(request);
}

export async function POST(request: Request) {
  return handleDetect(request);
}

async function handleDetect(request: Request) {
  try {
    let lat: number | null = null;
    let lng: number | null = null;

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body.latitude !== undefined) lat = parseFloat(body.latitude);
        else if (body.lat !== undefined) lat = parseFloat(body.lat);
        if (body.longitude !== undefined) lng = parseFloat(body.longitude);
        else if (body.lng !== undefined) lng = parseFloat(body.lng);
      } catch {
        // Body was empty or invalid JSON
      }
    }

    if (lat === null || lng === null) {
      const { searchParams } = new URL(request.url);
      const qLat = searchParams.get('lat') || searchParams.get('latitude');
      const qLng = searchParams.get('lng') || searchParams.get('longitude');
      if (qLat && qLng) {
        lat = parseFloat(qLat);
        lng = parseFloat(qLng);
      }
    }

    const result = await detectNearestCity(lat, lng);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Location detection error:', error);
    const status = error.message?.includes('No active cities') ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to detect location' },
      { status }
    );
  }
}

