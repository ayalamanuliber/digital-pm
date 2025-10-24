// API Route: Worker notifications
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KEYS = {
  NOTIFICATIONS: 'pm:notifications',
};

// GET - Get notifications for a worker
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

    // Get all notifications
    const allNotifications = await kv.get<any[]>(KEYS.NOTIFICATIONS) || [];

    // Get worker's tasks to filter notifications
    const projects = await kv.get<any[]>('pm:projects') || [];
    const workerNotifications = allNotifications.filter((notif: any) => {
      if (notif.projectId && notif.taskId) {
        const project = projects.find(p => p.id === notif.projectId);
        if (!project) return false;
        const task = project.tasks?.find((t: any) => t.id === notif.taskId);
        // Only show unread notifications for tasks assigned to this worker
        // Exclude worker's own actions
        const isRelevant = task && task.assignedTo === workerId && !notif.read;
        const isFromOffice = notif.type !== 'task_rejected';
        return isRelevant && isFromOffice;
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      notifications: workerNotifications,
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      );
    }

    // Get all notifications
    const allNotifications = await kv.get<any[]>(KEYS.NOTIFICATIONS) || [];

    // Find and mark notification as read
    const notification = allNotifications.find((n: any) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      await kv.set(KEYS.NOTIFICATIONS, allNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clear all notifications for a worker
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID required' },
        { status: 400 }
      );
    }

    // Get all notifications
    const allNotifications = await kv.get<any[]>(KEYS.NOTIFICATIONS) || [];

    // Get worker's tasks
    const projects = await kv.get<any[]>('pm:projects') || [];

    // Mark all worker notifications as read
    allNotifications.forEach((notif: any) => {
      if (notif.projectId && notif.taskId) {
        const project = projects.find(p => p.id === notif.projectId);
        if (project) {
          const task = project.tasks?.find((t: any) => t.id === notif.taskId);
          if (task && task.assignedTo === workerId) {
            notif.read = true;
          }
        }
      }
    });

    await kv.set(KEYS.NOTIFICATIONS, allNotifications);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to clear notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
