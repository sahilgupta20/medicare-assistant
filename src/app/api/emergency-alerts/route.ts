import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Creating emergency alert:', data)
    
    // Actually save to database
    const alert = await prisma.emergencyAlert.create({
      data: {
        medicationId: data.medicationId,
        medicationName: data.medicationName || 'Unknown Medication',
        alertType: data.alertType || 'missed_dose',
        severity: data.severity || 'medium',
        message: data.message,
        escalationLevel: data.escalationLevel || 1,
        status: 'active',
        userId: data.userId || null
      }
    })
    
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error creating emergency alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      where: { 
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}