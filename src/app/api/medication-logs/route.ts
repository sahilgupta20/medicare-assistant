// src/app/api/medication-logs/route.ts - COMPLETE FIX
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

/* 
🔧 WHAT'S CHANGING:
❌ OLD: Basic CRUD only, no query support
✅ NEW: Advanced querying by date, time, medication
✅ NEW: Better error handling and validation
✅ NEW: Support for checking if specific medication was taken today
*/

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📥 Creating medication log:', data)
    
    if (!data.medicationId) {
      return NextResponse.json(
        { error: 'Medication ID is required' },
        { status: 400 }
      )
    }

    let scheduledFor: Date
    if (data.scheduledFor) {
      scheduledFor = new Date(data.scheduledFor)
      if (isNaN(scheduledFor.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled time provided' },
          { status: 400 }
        )
      }
    } else {
      scheduledFor = new Date()
    }

    // 🆕 NEW: Check for duplicate logs (prevent double-logging)
    const existingLog = await prisma.medicationLog.findFirst({
      where: {
        medicationId: data.medicationId,
        scheduledFor: {
          gte: new Date(scheduledFor.getTime() - 5 * 60 * 1000), // 5 min before
          lte: new Date(scheduledFor.getTime() + 5 * 60 * 1000)  // 5 min after
        },
        status: 'TAKEN'
      }
    })

    if (existingLog) {
      console.log('⚠️ Duplicate log prevented for:', data.medicationId)
      return NextResponse.json(existingLog, { status: 200 }) // Return existing log
    }

    const log = await prisma.medicationLog.create({
      data: {
        medicationId: data.medicationId,
        scheduledFor: scheduledFor,
        takenAt: data.status === 'TAKEN' ? new Date() : null,
        status: data.status || 'TAKEN',
        notes: data.notes || ''
      }
    })

    console.log('✅ Successfully created medication log:', log.id)
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating medication log:', error)
    return NextResponse.json(
      { 
        error: 'Failed to log medication', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 🆕 NEW: Enhanced GET with advanced query support
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicationId = searchParams.get('medicationId')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('🔍 Querying logs with:', { medicationId, date, time, status, limit })

    let whereClause: any = {}

    // Filter by medication
    if (medicationId) {
      whereClause.medicationId = medicationId
    }

    // Filter by status
    if (status) {
      whereClause.status = status
    }

    // Filter by specific date
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z')
      const endOfDay = new Date(date + 'T23:59:59.999Z')
      whereClause.scheduledFor = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // 🆕 NEW: Filter by specific time (for checking if medication was taken)
    if (time && date) {
      const [hours, minutes] = time.split(':').map(Number)
      const targetDateTime = new Date(date + 'T00:00:00.000Z')
      targetDateTime.setUTCHours(hours, minutes, 0, 0)
      
      // Look for logs within 30 minutes of target time
      const windowStart = new Date(targetDateTime.getTime() - 30 * 60 * 1000)
      const windowEnd = new Date(targetDateTime.getTime() + 30 * 60 * 1000)
      
      whereClause.scheduledFor = {
        gte: windowStart,
        lte: windowEnd
      }
    }

    const logs = await prisma.medicationLog.findMany({
      where: whereClause,
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      include: {
        medication: {
          select: {
            name: true,
            dosage: true
          }
        }
      }
    })
    
    console.log(`📊 Retrieved ${logs.length} medication logs`)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('❌ Error fetching medication logs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch logs', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// 🆕 NEW: Update existing logs
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, status, notes } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      )
    }

    const updatedLog = await prisma.medicationLog.update({
      where: { id },
      data: {
        status: status || 'TAKEN',
        notes: notes || '',
        takenAt: status === 'TAKEN' ? new Date() : null
      }
    })

    console.log('✅ Updated medication log:', updatedLog.id)
    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('❌ Error updating medication log:', error)
    return NextResponse.json(
      { error: 'Failed to update log' },
      { status: 500 }
    )
  }
}

// 🆕 NEW: Delete logs (for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      )
    }

    await prisma.medicationLog.delete({
      where: { id }
    })

    console.log('🗑️ Deleted medication log:', id)
    return NextResponse.json({ message: 'Log deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting medication log:', error)
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 }
    )
  }
}

/*
📊 VISUAL CHANGE SUMMARY:

OLD API Capabilities:
├── Create log ✅
├── Get all logs ✅
└── Basic functionality only

NEW API Capabilities:
├── Create log with duplicate prevention ✅
├── Query by date, time, medication, status ✅
├── Update existing logs ✅
├── Delete logs ✅
├── Check if specific medication was taken ✅
└── Advanced filtering and validation ✅

EXAMPLE NEW QUERIES:
GET /api/medication-logs?date=2025-01-15                    → All logs for Jan 15
GET /api/medication-logs?medicationId=123&date=2025-01-15   → Specific med on specific day
GET /api/medication-logs?medicationId=123&time=08:00&date=2025-01-15 → Check if 8AM dose taken
GET /api/medication-logs?status=MISSED                      → All missed medications
*/