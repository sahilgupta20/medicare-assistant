// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const userId = searchParams.get('userId')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user (or first user if none specified)
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else {
      user = await prisma.user.findFirst()
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all active medications for the user
    const medications = await prisma.medication.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      }
    })

    // Get medication logs for the time period
    const medicationLogs = await prisma.medicationLog.findMany({
      where: {
        medication: {
          userId: user.id
        },
        scheduledFor: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        medication: true
      },
      orderBy: {
        scheduledFor: 'desc'
      }
    })

    // Calculate adherence statistics
    const adherenceStats = calculateAdherenceStats(medications, medicationLogs, days)
    
    // Generate daily breakdown
    const dailyBreakdown = generateDailyBreakdown(medications, medicationLogs, days)
    
    // Calculate medication-specific stats
    const medicationStats = calculateMedicationStats(medications, medicationLogs)
    
    // Generate insights and recommendations
    const insights = generateInsights(adherenceStats, medicationStats, dailyBreakdown)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      timeframe: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: days
      },
      overview: {
        totalMedications: medications.length,
        totalScheduledDoses: adherenceStats.totalScheduled,
        totalTakenDoses: adherenceStats.totalTaken,
        totalMissedDoses: adherenceStats.totalMissed,
        adherencePercentage: adherenceStats.adherencePercentage,
        streakDays: adherenceStats.currentStreak
      },
      dailyBreakdown,
      medicationStats,
      insights,
      trends: {
        adherenceByDay: dailyBreakdown.map(day => ({
          date: day.date,
          percentage: day.adherencePercentage
        })),
        missedMedicationPatterns: analyzeMissedPatterns(medicationLogs),
        bestPerformingTimes: findBestTimes(medicationLogs),
        improvementAreas: identifyImprovementAreas(medicationStats)
      }
    })

  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate overall adherence statistics
function calculateAdherenceStats(medications: any[], logs: any[], days: number) {
  // Calculate expected doses based on medication schedules
  let totalScheduled = 0
  
  medications.forEach(med => {
    const timesPerDay = med.times.split(',').length
    totalScheduled += timesPerDay * days
  })

  const totalTaken = logs.filter(log => log.status === 'TAKEN').length
  const totalMissed = logs.filter(log => log.status === 'MISSED').length
  const adherencePercentage = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(logs)

  return {
    totalScheduled,
    totalTaken,
    totalMissed,
    adherencePercentage,
    currentStreak
  }
}

// Helper function to generate daily breakdown
function generateDailyBreakdown(medications: any[], logs: any[], days: number) {
  const dailyBreakdown = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    // Calculate expected doses for this day
    const expectedDoses = medications.reduce((total, med) => {
      return total + med.times.split(',').length
    }, 0)
    
    // Get logs for this day
    const dayLogs = logs.filter((log: any) => {
      const logDate = new Date(log.scheduledFor).toISOString().split('T')[0]
      return logDate === dateString
    })
    
    const takenDoses = dayLogs.filter((log: any) => log.status === 'TAKEN').length
    const missedDoses = dayLogs.filter((log: any) => log.status === 'MISSED').length
    const adherencePercentage = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0
    
    dailyBreakdown.unshift({
      date: dateString,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      expectedDoses,
      takenDoses,
      missedDoses,
      adherencePercentage,
      status: adherencePercentage >= 90 ? 'excellent' : adherencePercentage >= 70 ? 'good' : 'needs_attention'
    })
  }
  
  return dailyBreakdown
}

// Helper function to calculate medication-specific statistics
function calculateMedicationStats(medications: any[], logs: any[]) {
  return medications.map(med => {
    const medLogs = logs.filter(log => log.medicationId === med.id)
    const taken = medLogs.filter(log => log.status === 'TAKEN').length
    const missed = medLogs.filter(log => log.status === 'MISSED').length
    const total = taken + missed
    const adherencePercentage = total > 0 ? Math.round((taken / total) * 100) : 0
    
    // Find most commonly missed times
    const missedTimes = medLogs
      .filter(log => log.status === 'MISSED')
      .map(log => new Date(log.scheduledFor).toTimeString().slice(0, 5))
    
    const timeFrequency = missedTimes.reduce((acc: any, time) => {
      acc[time] = (acc[time] || 0) + 1
      return acc
    }, {})
    
    const mostMissedTime = Object.keys(timeFrequency).length > 0 
      ? Object.keys(timeFrequency).reduce((a, b) => timeFrequency[a] > timeFrequency[b] ? a : b)
      : null

    return {
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times.split(','),
      totalScheduled: total,
      totalTaken: taken,
      totalMissed: missed,
      adherencePercentage,
      mostMissedTime,
      riskLevel: adherencePercentage < 70 ? 'high' : adherencePercentage < 85 ? 'medium' : 'low'
    }
  })
}

// Helper function to calculate current streak
function calculateCurrentStreak(logs: any[]) {
  const sortedLogs = logs
    .filter(log => log.status === 'TAKEN')
    .sort((a: any, b: any) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const log of sortedLogs) {
    const logDate = new Date(log.scheduledFor)
    logDate.setHours(0, 0, 0, 0)
    
    if (logDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

// Helper function to generate insights and recommendations
function generateInsights(adherenceStats: any, medicationStats: any[], dailyBreakdown: any[]) {
  const insights = []
  
  // Overall adherence insight
  if (adherenceStats.adherencePercentage >= 90) {
    insights.push({
      type: 'success',
      title: 'Excellent Adherence! 🎉',
      message: `You're doing amazing with ${adherenceStats.adherencePercentage}% adherence rate. Keep up the great work!`,
      priority: 'low'
    })
  } else if (adherenceStats.adherencePercentage >= 70) {
    insights.push({
      type: 'warning',
      title: 'Good Progress 👍',
      message: `You're at ${adherenceStats.adherencePercentage}% adherence. Let's work on getting to 90%+`,
      priority: 'medium'
    })
  } else {
    insights.push({
      type: 'alert',
      title: 'Needs Attention ⚠️',
      message: `Adherence is at ${adherenceStats.adherencePercentage}%. Consider setting more reminders or talking to your doctor.`,
      priority: 'high'
    })
  }
  
  // Streak insight
  if (adherenceStats.currentStreak > 0) {
    insights.push({
      type: 'info',
      title: `${adherenceStats.currentStreak} Day Streak! 🔥`,
      message: `You've been consistent for ${adherenceStats.currentStreak} days. Every day counts!`,
      priority: 'low'
    })
  }
  
  // Medication-specific insights
  const problematicMeds = medicationStats.filter(med => med.adherencePercentage < 70)
  if (problematicMeds.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Some Medications Need Attention',
      message: `${problematicMeds.map(med => med.medicationName).join(', ')} have lower adherence rates.`,
      priority: 'high'
    })
  }
  
  // Time-based insights
  const recentDays = dailyBreakdown.slice(-3)
  const recentAverageAdherence = recentDays.reduce((sum, day) => sum + day.adherencePercentage, 0) / recentDays.length
  
  if (recentAverageAdherence > 85) {
    insights.push({
      type: 'success',
      title: 'Recent Improvement! 📈',
      message: 'Your adherence has been improving over the last few days. Great momentum!',
      priority: 'low'
    })
  }
  
  return insights
}

// Helper function to analyze missed medication patterns
function analyzeMissedPatterns(logs: any[]) {
  const missedLogs = logs.filter(log => log.status === 'MISSED')
  
  // Group by day of week
  const dayPatterns = missedLogs.reduce((acc: any, log) => {
    const dayOfWeek = new Date(log.scheduledFor).toLocaleDateString('en-US', { weekday: 'long' })
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
    return acc
  }, {})
  
  // Group by time of day
  const timePatterns = missedLogs.reduce((acc: any, log) => {
    const hour = new Date(log.scheduledFor).getHours()
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
    acc[timeOfDay] = (acc[timeOfDay] || 0) + 1
    return acc
  }, {})
  
  return {
    byDayOfWeek: dayPatterns,
    byTimeOfDay: timePatterns,
    totalMissed: missedLogs.length
  }
}

// Helper function to find best performing times
function findBestTimes(logs: any[]) {
  const timeStats = logs.reduce((acc: any, log) => {
    const time = new Date(log.scheduledFor).toTimeString().slice(0, 5)
    if (!acc[time]) {
      acc[time] = { taken: 0, total: 0 }
    }
    acc[time].total++
    if (log.status === 'TAKEN') {
      acc[time].taken++
    }
    return acc
  }, {})
  
  return Object.entries(timeStats)
    .map(([time, stats]: [string, any]) => ({
      time,
      adherencePercentage: Math.round((stats.taken / stats.total) * 100),
      totalDoses: stats.total
    }))
    .sort((a, b) => b.adherencePercentage - a.adherencePercentage)
    .slice(0, 3)
}

// Helper function to identify improvement areas
function identifyImprovementAreas(medicationStats: any[]) {
  const areas = []
  
  // Find medications with low adherence
  const lowAdherence = medicationStats.filter(med => med.adherencePercentage < 80)
  if (lowAdherence.length > 0) {
    areas.push({
      area: 'Medication Adherence',
      medications: lowAdherence.map(med => med.medicationName),
      suggestion: 'Consider setting additional reminders or using a pill organizer'
    })
  }
  
  // Find commonly missed times
  const missedTimes = medicationStats
    .filter(med => med.mostMissedTime)
    .map(med => med.mostMissedTime)
  
  if (missedTimes.length > 0) {
    const mostCommonMissedTime = missedTimes.reduce((acc: any, time) => {
      acc[time] = (acc[time] || 0) + 1
      return acc
    }, {})
    
    const problematicTime = Object.keys(mostCommonMissedTime).reduce((a, b) => 
      mostCommonMissedTime[a] > mostCommonMissedTime[b] ? a : b
    )
    
    areas.push({
      area: 'Timing Consistency',
      problematicTime,
      suggestion: `Consider adjusting ${problematicTime} medications to a more convenient time`
    })
  }
  
  return areas
}