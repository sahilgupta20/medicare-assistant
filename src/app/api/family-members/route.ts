import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const familyMembers = await prisma.familyMember.findMany({
      include: {
        senior: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse notificationPreferences from JSON string to object for each member
    const parsedFamilyMembers = familyMembers.map((member) => ({
      ...member,
      notificationPreferences:
        typeof member.notificationPreferences === "string"
          ? JSON.parse(member.notificationPreferences)
          : member.notificationPreferences,
    }));

    console.log("Fetched family members:", parsedFamilyMembers.length);
    return NextResponse.json(parsedFamilyMembers);
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Failed to fetch family members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Creating family member:", data.name);

    const firstSenior = await prisma.user.findFirst({
      where: { role: "SENIOR" },
    });

    const familyMember = await prisma.familyMember.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        relationship: data.relationship,
        role: data.role || "secondary",
        timezone: data.timezone || "Asia/Kolkata",
        isEmergencyContact: data.isEmergencyContact || false,
        notificationPreferences: JSON.stringify(
          data.notificationPreferences || {
            daily_summary: true,
            missed_medication: true,
            emergency_only: false,
            preferred_method: "both",
          }
        ),
        seniorId: firstSenior?.id,
      },
    });

    console.log("Created family member:", familyMember.id);

    // Return with parsed notificationPreferences
    const responseData = {
      ...familyMember,
      notificationPreferences: JSON.parse(
        familyMember.notificationPreferences as string
      ),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Failed to create family member" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Family member ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📝 Updating family member:", id, body);

    const updatedFamilyMember = await prisma.familyMember.update({
      where: { id },
      data: {
        name: body.name,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email,
        role: body.role,
        timezone: body.timezone,
        isEmergencyContact: body.isEmergencyContact,
        // Convert notificationPreferences object to JSON string for storage
        notificationPreferences: JSON.stringify(body.notificationPreferences),
      },
    });

    console.log(" Updated family member:", updatedFamilyMember.id);

    // Return with parsed notificationPreferences
    const responseData = {
      ...updatedFamilyMember,
      notificationPreferences: JSON.parse(
        updatedFamilyMember.notificationPreferences as string
      ),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(" Error updating family member:", error);
    console.error("Full error details:", error);

    const prismaError = error as { code?: string; message?: string };

    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update family member", details: prismaError.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Family member ID required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting family member:", id);

    await prisma.familyMember.delete({
      where: { id },
    });

    console.log(" Deleted family member:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(" Error deleting family member:", error);

    const prismaError = error as { code?: string };

    // Handle specific Prisma errors
    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete family member" },
      { status: 500 }
    );
  }
}
