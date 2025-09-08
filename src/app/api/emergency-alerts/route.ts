import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Emergency alert created:', data)
    
    // For now, just return success without database
    const alert = {
      id: `alert-${Date.now()}`,
      ...data,
      created: new Date()
    }
    
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error creating emergency alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}