// DEBUG API: Check what's in KV database
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    const workers = await kv.get('pm:workers');
    const projects = await kv.get('pm:projects');
    const timestamp = await kv.get('pm:sync:timestamp');

    return NextResponse.json({
      success: true,
      data: {
        workers: workers || [],
        projects: projects || [],
        timestamp: timestamp || 'never synced',
        workerCount: Array.isArray(workers) ? workers.length : 0,
        projectCount: Array.isArray(projects) ? projects.length : 0,
        workersWithPins: Array.isArray(workers)
          ? (workers as any[]).filter(w => w.pin).length
          : 0,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
