// API Route: Sync data between admin localStorage and Vercel KV
import { NextRequest, NextResponse } from 'next/server';
import { syncToCloud, fetchFromCloud } from '@/lib/kv';

// POST - Admin syncs data TO cloud
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projects, workers } = body;

    const result = await syncToCloud({ projects, workers });

    if (result.success) {
      return NextResponse.json({
        success: true,
        timestamp: result.timestamp,
        message: 'Data synced successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Workers fetch data FROM cloud
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromCloud();

    if (data) {
      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'No data found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
