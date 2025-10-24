// API Route: Get messages from cloud for admin sync
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    // Get all messages from cloud
    const messages = await kv.get<any[]>('pm:messages') || [];

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Failed to get messages from cloud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
