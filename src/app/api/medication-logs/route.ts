import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Received POST data:', data)
    
    if (!data.medicationId) {
      console.error('Missing medicationId')
      return NextResponse.json(
        { error: 'Medication ID is required' },
        { status: 400 }
      )
    }

    
    let scheduledFor: Date
    if (data.scheduledFor) {
      scheduledFor = new Date(data.scheduledFor)
      // Check if the date is valid
      if (isNaN(scheduledFor.getTime())) {
        console.error('Invalid date received:', data.scheduledFor)
        return NextResponse.json(
          { error: 'Invalid scheduled time provided' },
          { status: 400 }
        )
      }
    } else {
      scheduledFor = new Date() // Default to now
    }

    console.log('Creating log with scheduledFor:', scheduledFor.toISOString())

 
    const log = await prisma.medicationLog.create({
      data: {
        medicationId: data.medicationId,
        scheduledFor: scheduledFor,
        takenAt: data.status === 'TAKEN' ? new Date() : null,
        status: data.status || 'TAKEN',
        notes: data.notes || ''
       
      }
    })

    console.log('Successfully created medication log:', log.id)
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Detailed error creating medication log:', error)
    return NextResponse.json(
      { 
        error: 'Failed to log medication', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('Fetching medication logs...')
    const logs = await prisma.medicationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    console.log(`Retrieved ${logs.length} medication logs`)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Detailed error fetching medication logs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch logs', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}