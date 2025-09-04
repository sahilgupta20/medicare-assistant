import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(medications)
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    

    if (!data.name || !data.dosage) {
      return NextResponse.json(
        { error: 'Name and dosage are required' },
        { status: 400 }
      )
    }


    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'sahil@example.com',
          name: 'Sahil',
          role: 'SENIOR'
        }
      })
    }

    const medication = await prisma.medication.create({
      data: {
        name: data.name,
        dosage: data.dosage,
        description: data.description || '',
        color: data.color || '',
        shape: data.shape || '',
        frequency: data.frequency || 'daily',
        times: Array.isArray(data.times) ? data.times.join(',') : (data.times || '08:00'),
        startDate: new Date(),
        userId: user.id
      }
    })

    return NextResponse.json(medication, { status: 201 })
  } catch (error) {
    console.error('Error creating medication:', error)
    return NextResponse.json(
      { error: 'Failed to create medication' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Medication ID is required' },
        { status: 400 }
      )
    }

    await prisma.medication.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Medication deleted successfully' })
  } catch (error) {
    console.error('Error deleting medication:', error)
    return NextResponse.json(
      { error: 'Failed to delete medication' },
      { status: 500 }
    )
  }
}