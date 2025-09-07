import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const familyMembers = await prisma.familyMember.findMany({
      include: {
        senior: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Fetched family members:', familyMembers.length);
    return NextResponse.json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Creating family member:', data.name);
    
    const firstSenior = await prisma.user.findFirst({
      where: { role: 'SENIOR' }
    });
    
    const familyMember = await prisma.familyMember.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        relationship: data.relationship,
        role: data.role || 'secondary',
        timezone: data.timezone || 'Asia/Kolkata',
        isEmergencyContact: data.isEmergencyContact || false,
        notificationPreferences: JSON.stringify(data.notificationPreferences || {
          daily_summary: true,
          missed_medication: true,
          emergency_only: false,
          preferred_method: 'both'
        }),
        seniorId: firstSenior?.id
      }
    });

    console.log('Created family member:', familyMember.id);
    return NextResponse.json(familyMember);
  } catch (error) {
    console.error('Error creating family member:', error);
    return NextResponse.json({ error: 'Failed to create family member' }, { status: 500 });
  }
}