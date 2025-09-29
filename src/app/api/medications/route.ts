import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all medications
export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Fetched medications:", medications.length);
    return NextResponse.json(medications);
  } catch (error) {
    console.error("Error fetching medications:", error);
    return NextResponse.json(
      { error: "Failed to fetch medications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log(" Creating medication:", data);

    const validationErrors = [];
    if (!data.name?.trim()) validationErrors.push("Name is required");
    if (!data.dosage?.trim()) validationErrors.push("Dosage is required");
    if (
      !data.times &&
      (!Array.isArray(data.times) || data.times.length === 0)
    ) {
      validationErrors.push("At least one time is required");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findFirst({
      where: { role: "SENIOR" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "sahil@example.com",
          name: "Sahil",
          role: "SENIOR",
        },
      });
      console.log("👤 Created new user:", user.id);
    }

    // Process times - handle both array and string formats
    let timesString = "";
    if (Array.isArray(data.times)) {
      timesString = data.times.join(",");
    } else if (typeof data.times === "string") {
      timesString = data.times;
    } else {
      timesString = "08:00"; // Default fallback
    }

    const medication = await prisma.medication.create({
      data: {
        name: data.name.trim(),
        dosage: data.dosage.trim(),
        description: data.description?.trim() || "",
        color: data.color?.trim() || "",
        shape: data.shape?.trim() || "",
        frequency: data.frequency || "daily",
        times: timesString,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        photoUrl: data.photoUrl || null,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Created medication:", medication.id);
    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating medication:", error);
    return NextResponse.json(
      { error: "Failed to create medication", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing medication
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Medication ID required" },
        { status: 400 }
      );
    }

    const data = await request.json();
    console.log("📝 Updating medication:", id, data);

    // Enhanced validation for updates
    const validationErrors = [];
    if (!data.name?.trim()) validationErrors.push("Name is required");
    if (!data.dosage?.trim()) validationErrors.push("Dosage is required");

    // Validate times
    let timesString = "";
    if (Array.isArray(data.times)) {
      if (data.times.length === 0) {
        validationErrors.push("At least one time is required");
      } else {
        timesString = data.times.join(",");
      }
    } else if (typeof data.times === "string") {
      if (!data.times.trim()) {
        validationErrors.push("At least one time is required");
      } else {
        timesString = data.times;
      }
    } else {
      validationErrors.push("Times must be provided");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Check if medication exists
    const existingMedication = await prisma.medication.findUnique({
      where: { id },
    });

    if (!existingMedication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    const updatedMedication = await prisma.medication.update({
      where: { id },
      data: {
        name: data.name.trim(),
        dosage: data.dosage.trim(),
        description: data.description?.trim() || "",
        color: data.color?.trim() || "",
        shape: data.shape?.trim() || "",
        frequency: data.frequency || existingMedication.frequency,
        times: timesString,
        startDate: data.startDate
          ? new Date(data.startDate)
          : existingMedication.startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive:
          data.isActive !== undefined
            ? data.isActive
            : existingMedication.isActive,
        photoUrl:
          data.photoUrl !== undefined
            ? data.photoUrl
            : existingMedication.photoUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Updated medication:", updatedMedication.id);
    return NextResponse.json(updatedMedication);
  } catch (error) {
    console.error("❌ Error updating medication:", error);

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update medication", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove medication (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Medication ID is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting medication:", id);

    // Check if medication exists
    const existingMedication = await prisma.medication.findUnique({
      where: { id },
    });

    if (!existingMedication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive instead of actually deleting
    await prisma.medication.update({
      where: { id },
      data: {
        isActive: false,
        // Optionally add deletion timestamp
        // deletedAt: new Date()
      },
    });

    // If you want hard delete instead, use this:
    // await prisma.medication.delete({
    //   where: { id }
    // })

    console.log("✅ Deleted medication:", id);
    return NextResponse.json({
      message: "Medication deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("❌ Error deleting medication:", error);

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete medication", details: error.message },
      { status: 500 }
    );
  }
}
