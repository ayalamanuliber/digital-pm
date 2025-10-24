// API Route: Worker updates task status (accept/reject/complete)
import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatus } from '@/lib/kv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, workerId, action, reason } = body;

    if (!projectId || !taskId || !workerId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let updates: any = {};

    switch (action) {
      case 'accept':
        updates = {
          status: 'confirmed',
          assignedDate: new Date().toISOString(),
        };
        break;

      case 'reject':
        updates = {
          status: 'rejected',
          rejectionReason: reason || 'No reason provided',
          assignedTo: undefined,
        };
        break;

      case 'start':
        updates = {
          status: 'in_progress',
        };
        break;

      case 'complete':
        updates = {
          status: 'completed',
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add activity log
    updates.activity = updates.activity || [];
    updates.activity.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      action: action,
      user: workerId,
      details: reason || `Task ${action}ed by worker`,
    });

    const result = await updateTaskStatus(projectId, taskId, updates);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Task ${action}ed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
