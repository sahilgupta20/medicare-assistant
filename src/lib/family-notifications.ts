// src/lib/family-notifications.ts
import { prisma } from "@/lib/prisma";

export async function sendDailyFamilyUpdates() {
  try {
    // Get all seniors who have family members
    const seniors = await prisma.user.findMany({
      where: {
        role: "SENIOR",
        familyMembersAsSenior: {
          some: {},
        },
      },
      include: {
        familyMembersAsSenior: true,
      },
    });

    const results = [];

    for (const senior of seniors) {
      try {
        // Send daily update for each senior
        const result = await fetch("/api/family/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seniorId: senior.id,
            type: "daily_update",
            message: "Automated daily health update",
          }),
        });

        results.push({
          seniorId: senior.id,
          seniorName: senior.name,
          status: result.ok ? "sent" : "failed",
        });
      } catch (error) {
        results.push({
          seniorId: senior.id,
          seniorName: senior.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
}
