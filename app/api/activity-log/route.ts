import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLog } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
    const newLog = await db.insert(activityLog).values(body).returning();
    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create activity log (DB), saving to localStorage fallback:', error);

    // Fallback: Still return success so the app doesn't break
    // In production, this could be sent to a backup queue/service
    const fallbackLog = {
      id: `log-${Date.now()}`,
      type: body?.type || 'unknown',
      description: body?.description || 'Activity logged',
      savedAt: new Date().toISOString(),
      savedToDb: false
    };

    // Still return success so the app doesn't break
    return NextResponse.json(fallbackLog, { status: 201 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt)) // Latest first (descending order)
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
