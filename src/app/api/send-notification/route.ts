// src/app/api/send-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { familyMember, message, urgency, medicationDetails } =
      await request.json();

    console.log(
      `Sending Gmail notification to ${familyMember.name} at ${familyMember.email}`
    );

    const emailResult = await emailTransporter.sendMail({
      from: `"MediCare Assistant" <${process.env.EMAIL_USER!}>`,
      to: familyMember.email,
      subject:
        urgency === "high"
          ? "URGENT - MediCare Alert"
          : "MediCare Notification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>MediCare Alert</h1>
          </div>
          <div style="padding: 20px; background: white;">
            <h2 style="color: ${urgency === "high" ? "#dc2626" : "#f59e0b"};">
              ${
                urgency === "high"
                  ? "🚨 URGENT ALERT"
                  : "💊 Medication Reminder"
              }
            </h2>
            <p style="font-size: 16px;">${message}</p>
            <p><strong>Patient:</strong> Sahil</p>
            <p><strong>Family Member:</strong> ${familyMember.name}</p>
            
            ${
              medicationDetails
                ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Medication Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${medicationDetails.name}</li>
                  <li><strong>Dosage:</strong> ${medicationDetails.dosage}</li>
                  <li><strong>Scheduled:</strong> ${medicationDetails.scheduledTime}</li>
                </ul>
              </div>
            `
                : ""
            }
            
            <p style="color: #666; font-size: 12px;">
              Sent at ${new Date().toLocaleString()} by MediCare Assistant
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Gmail sent successfully to ${familyMember.name}`);

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      familyMember: familyMember.name,
      recipient: familyMember.email,
    });
  } catch (error) {
    console.error("Gmail send failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to send Gmail",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
