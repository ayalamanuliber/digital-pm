import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allWorkers = await db.select().from(workers);
    return NextResponse.json(allWorkers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newWorker = await db.insert(workers).values(body).returning();
    return NextResponse.json(newWorker[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    const updated = await db
      .update(workers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workers.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Worker ID required' }, { status: 400 });
    }

    await db.delete(workers).where(eq(workers.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}
