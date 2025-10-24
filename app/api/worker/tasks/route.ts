// API Route: Get tasks for a specific worker
import { NextRequest, NextResponse } from 'next/server';
import { getWorkerTasks } from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID required' },
        { status: 400 }
      );
    }

    const tasks = await getWorkerTasks(workerId);

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
