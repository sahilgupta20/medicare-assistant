// src/app/api/emergency-alerts/[id]/route.ts (create this file)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();
    const alertId = params.id;

    if (action === 'acknowledge' || action === 'resolve') {
      // Mark as resolved, don't delete
      const updatedAlert = await prisma.emergencyAlert.update({
        where: { id: alertId },
        data: { 
          status: 'resolved',
          resolvedAt: new Date()
        }
      });

      console.log(`Alert ${alertId} resolved at ${new Date().toISOString()}`);
      
      return NextResponse.json({ 
        success: true, 
        alert: updatedAlert,
        message: 'Alert marked as resolved'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}