// src/app/api/family/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { seniorId, type, message, urgency = "normal" } = data;

    // Get senior user
    const senior = await prisma.user.findUnique({
      where: { id: seniorId },
      include: {
        familyMembersAsSenior: true,
      },
    });

    if (!senior) {
      return NextResponse.json({ error: "Senior not found" }, { status: 404 });
    }

    const recentLogs = await prisma.medicationLog.findMany({
      where: {
        medication: {
          userId: seniorId,
        },
        scheduledFor: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        medication: true,
      },
      orderBy: {
        scheduledFor: "desc",
      },
    });

    // Calculate today's adherence
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = recentLogs.filter(
      (log) => new Date(log.scheduledFor).toISOString().split("T")[0] === today
    );

    const takenToday = todayLogs.filter((log) => log.status === "TAKEN").length;
    const totalToday = todayLogs.length;
    const adherencePercentage =
      totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

    //  notification data
    const notificationData = {
      seniorName: senior.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      adherencePercentage,
      medicationsTakenToday: takenToday,
      totalMedicationsToday: totalToday,
      recentMedications: todayLogs.map((log) => ({
        name: log.medication.name,
        dosage: log.medication.dosage,
        scheduledTime: new Date(log.scheduledFor).toLocaleTimeString(),
        status: log.status,
        takenAt: log.takenAt
          ? new Date(log.takenAt).toLocaleTimeString()
          : null,
      })),
      urgency,
      type,
      customMessage: message,
    };

    // Send notifications to all family members
    const notifications = [];

    for (const familyMember of senior.familyMembersAsSenior) {
      try {
        if (familyMember.email) {
          const emailSent = await sendEmailNotification(
            familyMember.email,
            notificationData
          );
          notifications.push({
            recipientId: familyMember.id,
            recipientName: familyMember.name,
            method: "email",
            status: emailSent ? "sent" : "failed",
            sentAt: new Date(),
          });
        }

        // Send SMS notification (if phone number available)
        if (familyMember.phone) {
          const smsSent = await sendSMSNotification(
            familyMember.phone,
            notificationData
          );
          notifications.push({
            recipientId: familyMember.id,
            recipientName: familyMember.name,
            method: "sms",
            status: smsSent ? "sent" : "failed",
            sentAt: new Date(),
          });
        }
      } catch (error) {
        console.error(
          `Failed to send notification to ${familyMember.name}:`,
          error
        );
        notifications.push({
          recipientId: familyMember.id,
          recipientName: familyMember.name,
          method: "email",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          sentAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      message: "Notifications sent successfully",
      senior: {
        id: senior.id,
        name: senior.name,
      },
      summary: notificationData,
      notifications,
      stats: {
        totalRecipients: senior.caregivers.length,
        successful: notifications.filter((n) => n.status === "sent").length,
        failed: notifications.filter((n) => n.status === "failed").length,
      },
    });
  } catch (error) {
    console.error("Family notification error:", error);
    return NextResponse.json(
      {
        error: "Failed to send family notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get family notifications history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seniorId = searchParams.get("seniorId");
    const days = parseInt(searchParams.get("days") || "7");

    if (!seniorId) {
      return NextResponse.json(
        { error: "Senior ID required" },
        { status: 400 }
      );
    }

    // For now, return mock data since we haven't implemented notification logging
    // In production, you'd store notifications in the database
    const mockNotifications = generateMockNotificationHistory(seniorId, days);

    return NextResponse.json({
      seniorId,
      notifications: mockNotifications,
      summary: {
        totalSent: mockNotifications.length,
        lastSent: mockNotifications[0]?.sentAt || null,
        avgAdherence: 85, // Mock average
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification history" },
      { status: 500 }
    );
  }
}

// Helper function to send email notifications
async function sendEmailNotification(
  email: string,
  data: any
): Promise<boolean> {
  // In production, integrate with services like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend

  console.log(`📧 Sending email to ${email}:`);
  console.log("Subject: Daily Health Update for", data.seniorName);
  console.log("Content:", formatEmailContent(data));

  // Mock successful send for demo
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 100);
  });
}

// Helper function to send SMS notifications
async function sendSMSNotification(phone: string, data: any): Promise<boolean> {
  // In production, integrate with services like:
  // - Twilio
  // - AWS SNS
  // - MessageBird

  const smsContent = formatSMSContent(data);
  console.log(`📱 Sending SMS to ${phone}:`);
  console.log(smsContent);

  // Mock successful send for demo
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 100);
  });
}

// Helper function to format email content
function formatEmailContent(data: any): string {
  const statusEmoji =
    data.adherencePercentage >= 90
      ? "🟢"
      : data.adherencePercentage >= 70
      ? "🟡"
      : "🔴";

  return `
    Daily Health Update for ${data.seniorName} ${statusEmoji}
    
    Date: ${data.date}
    Medication Adherence: ${data.adherencePercentage}%
    Medications Taken Today: ${data.medicationsTakenToday}/${
    data.totalMedicationsToday
  }
    
    Today's Medication Summary:
    ${data.recentMedications
      .map(
        (med: any) =>
          `• ${med.name} (${med.dosage}) at ${med.scheduledTime} - ${
            med.status === "TAKEN"
              ? "✅ Taken" + (med.takenAt ? ` at ${med.takenAt}` : "")
              : med.status === "MISSED"
              ? "❌ Missed"
              : "⏳ Pending"
          }`
      )
      .join("\n    ")}
    
    ${data.customMessage ? `\nNote: ${data.customMessage}` : ""}
    
    ${data.urgency === "high" ? "⚠️ This update requires your attention." : ""}
    
    Stay connected with ${data.seniorName}'s health journey.
    
    Sent from MediCare Assistant
  `;
}

// Helper function to format SMS content
function formatSMSContent(data: any): string {
  const statusEmoji =
    data.adherencePercentage >= 90
      ? "🟢"
      : data.adherencePercentage >= 70
      ? "🟡"
      : "🔴";

  return `${statusEmoji} ${data.seniorName} Health Update: ${
    data.adherencePercentage
  }% medication adherence today (${data.medicationsTakenToday}/${
    data.totalMedicationsToday
  } taken). ${
    data.urgency === "high" ? "Needs attention." : "All good!"
  } - MediCare Assistant`;
}

// Helper function to generate mock notification history
function generateMockNotificationHistory(seniorId: string, days: number) {
  const notifications = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random adherence percentage for demo
    const adherence = Math.floor(Math.random() * 40) + 60; // 60-100%

    notifications.push({
      id: `notif-${i}`,
      seniorId,
      type: "daily_update",
      sentAt: date.toISOString(),
      recipients: [
        {
          name: "Priya Sharma",
          email: "priya@email.com",
          method: "email",
          status: "sent",
        },
        {
          name: "Dr. Sarah Johnson",
          email: "sarah@familydoc.com",
          method: "email",
          status: "sent",
        },
      ],
      summary: {
        adherencePercentage: adherence,
        medicationsTaken: adherence >= 90 ? 3 : adherence >= 70 ? 2 : 1,
        totalMedications: 3,
        status:
          adherence >= 90
            ? "excellent"
            : adherence >= 70
            ? "good"
            : "needs_attention",
      },
    });
  }

  return notifications;
}

// Auto-send daily updates (would be called by a cron job)
// export async function sendDailyFamilyUpdates() {
//   try {
//     // Get all seniors who have family members
//     const seniors = await prisma.user.findMany({
//       where: {
//         role: 'SENIOR',
//         caregivers: {
//           some: {}
//         }
//       },
//       include: {
//         caregivers: {
//           include: {
//             caregiver: true
//           }
//         }
//       }
//     })

//     const results = []

//     for (const senior of seniors) {
//       try {
//         // Send daily update for each senior
//         const result = await fetch('/api/family/notifications', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             seniorId: senior.id,
//             type: 'daily_update',
//             message: 'Automated daily health update'
//           })
//         })

//         results.push({
//           seniorId: senior.id,
//           seniorName: senior.name,
//           status: result.ok ? 'sent' : 'failed'
//         })

//       } catch (error) {
//         results.push({
//           seniorId: senior.id,
//           seniorName: senior.name,
//           status: 'failed',
//           error: error instanceof Error ? error.message : 'Unknown error'
//         })
//       }
//     }

//     return results

//   } catch (error) {
//     console.error('Daily updates failed:', error)
//     throw error
//   }
// }
