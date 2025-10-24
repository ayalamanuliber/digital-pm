// API Route: Worker messages
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KEYS = {
  MESSAGES: 'pm:messages',
};

// GET - Get messages for a worker
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

    // Get all messages
    const allMessages = await kv.get<any[]>(KEYS.MESSAGES) || [];

    // Get worker's tasks to filter messages
    const projects = await kv.get<any[]>('pm:projects') || [];
    const workerMessages = allMessages
      .filter((msg: any) => {
        const project = projects.find(p => p.id === msg.projectId);
        if (!project) return false;
        const task = project.tasks?.find((t: any) => t.id === msg.taskId);
        return task && task.assignedTo === workerId;
      })
      .map((msg: any) => {
        // Add project and task metadata to each message thread
        const project = projects.find(p => p.id === msg.projectId);
        const task = project?.tasks?.find((t: any) => t.id === msg.taskId);
        return {
          ...msg,
          projectNumber: project?.number || '',
          projectColor: project?.color || 'blue',
          taskDescription: task?.description || '',
        };
      });

    return NextResponse.json({
      success: true,
      messages: workerMessages,
    });
  } catch (error: any) {
    console.error('Failed to get messages:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, text, sender, workerId } = body;

    if (!projectId || !taskId || !text || !sender) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all messages
    const allMessages = await kv.get<any[]>(KEYS.MESSAGES) || [];

    // Find or create message thread
    let thread = allMessages.find((m: any) => m.projectId === projectId && m.taskId === taskId);

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };

    if (thread) {
      thread.messages.push(newMessage);
    } else {
      thread = {
        projectId,
        taskId,
        messages: [newMessage],
      };
      allMessages.push(thread);
    }

    // Save messages
    await kv.set(KEYS.MESSAGES, allMessages);

    // Create notification if message is from admin/office to worker
    if (sender === 'admin' || sender === 'Office' || sender.toLowerCase().includes('office')) {
      try {
        const notifications = await kv.get<any[]>('pm:notifications') || [];
        const projects = await kv.get<any[]>('pm:projects') || [];

        // Get project info for notification
        const project = projects.find(p => p.id === projectId);
        const task = project?.tasks?.find((t: any) => t.id === taskId);

        if (task && task.assignedTo) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'message_received',
            title: 'New Message from Office',
            message: `Office: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
            projectId,
            taskId,
            workerId: task.assignedTo,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'medium'
          };

          notifications.unshift(notification);
          await kv.set('pm:notifications', notifications);
          console.log('✅ Created notification for worker:', task.assignedTo);
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the message send if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, workerId } = body;

    if (!projectId || !taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all messages
    const allMessages = await kv.get<any[]>(KEYS.MESSAGES) || [];

    // Find thread and mark messages as read
    const thread = allMessages.find((m: any) => m.projectId === projectId && m.taskId === taskId);

    if (thread) {
      thread.messages.forEach((msg: any) => {
        if (msg.sender !== workerId) {
          msg.read = true;
        }
      });

      // Save updated messages
      await kv.set(KEYS.MESSAGES, allMessages);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
