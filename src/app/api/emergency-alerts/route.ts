import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const activeAlerts = await prisma.emergencyAlert.findMany({
      where: { 
        status: 'active'
      },
      include: {
        medication: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Fetched active alerts:', activeAlerts.length);
    return NextResponse.json(activeAlerts);
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Creating emergency alert for:', data.medicationName);
    
    const alert = await prisma.emergencyAlert.create({
      data: {
        medicationId: data.medicationId,
        alertType: data.alertType || 'missed_dose',
        severity: data.severity || 'medium',
        message: data.message,
        escalationLevel: data.escalationLevel || 1,
        status: 'active'
      }
    });

    console.log('Created emergency alert:', alert.id);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}