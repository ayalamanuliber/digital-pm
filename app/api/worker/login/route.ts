// API Route: Worker login with PIN
import { NextRequest, NextResponse } from 'next/server';
import { getWorkerByPin, trackWorkerSession } from '@/lib/kv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format' },
        { status: 400 }
      );
    }

    const worker = await getWorkerByPin(pin);

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN. Please try again.' },
        { status: 401 }
      );
    }

    // Track session
    await trackWorkerSession(worker.id, worker.name);

    return NextResponse.json({
      success: true,
      worker: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        skills: worker.skills,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
