import { prisma } from "@/lib/prisma";

/**
 * Pricing for Anthropic Claude models (as of 2025)
 * Prices are per million tokens
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": {
    input: 0.8, // $0.80 per million input tokens
    output: 4.0, // $4.00 per million output tokens
  },
  "claude-sonnet-4": {
    input: 3.0, // $3.00 per million input tokens
    output: 15.0, // $15.00 per million output tokens
  },
  "claude-opus-4": {
    input: 15.0, // $15.00 per million input tokens
    output: 75.0, // $75.00 per million output tokens
  },
  // Mock provider (free)
  mock: {
    input: 0,
    output: 0,
  },
};

export interface UsageMetadata {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  duration?: number; // in milliseconds
  userId?: string;
  projectId?: string;
  status?: "success" | "error" | "partial";
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Calculate the estimated cost based on token usage and model pricing
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["claude-haiku-4-5"];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Track AI usage in the database
 */
export async function trackUsage(usage: UsageMetadata): Promise<void> {
  try {
    const estimatedCost = calculateCost(
      usage.model,
      usage.inputTokens,
      usage.outputTokens
    );

    await prisma.aIUsage.create({
      data: {
        userId: usage.userId,
        projectId: usage.projectId,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        estimatedCost,
        duration: usage.duration,
        status: usage.status || "success",
        errorMessage: usage.errorMessage,
        metadata: JSON.stringify(usage.metadata || {}),
      },
    });
  } catch (error) {
    console.error("Failed to track AI usage:", error);
    // Don't throw - we don't want tracking failures to break the app
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string) {
  const usageRecords = await prisma.aIUsage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const totalInputTokens = usageRecords.reduce(
    (sum, record) => sum + record.inputTokens,
    0
  );
  const totalOutputTokens = usageRecords.reduce(
    (sum, record) => sum + record.outputTokens,
    0
  );
  const totalTokens = usageRecords.reduce(
    (sum, record) => sum + record.totalTokens,
    0
  );
  const totalCost = usageRecords.reduce(
    (sum, record) => sum + record.estimatedCost,
    0
  );

  return {
    totalRequests: usageRecords.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    recentUsage: usageRecords.slice(0, 10),
  };
}

/**
 * Get usage statistics for a project
 */
export async function getProjectUsageStats(projectId: string) {
  const usageRecords = await prisma.aIUsage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  const totalInputTokens = usageRecords.reduce(
    (sum, record) => sum + record.inputTokens,
    0
  );
  const totalOutputTokens = usageRecords.reduce(
    (sum, record) => sum + record.outputTokens,
    0
  );
  const totalTokens = usageRecords.reduce(
    (sum, record) => sum + record.totalTokens,
    0
  );
  const totalCost = usageRecords.reduce(
    (sum, record) => sum + record.estimatedCost,
    0
  );

  return {
    totalRequests: usageRecords.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    recentUsage: usageRecords.slice(0, 10),
  };
}

/**
 * Get usage statistics for a specific time period
 */
export async function getUsageStatsForPeriod(
  startDate: Date,
  endDate: Date,
  userId?: string
) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const usageRecords = await prisma.aIUsage.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const totalInputTokens = usageRecords.reduce(
    (sum, record) => sum + record.inputTokens,
    0
  );
  const totalOutputTokens = usageRecords.reduce(
    (sum, record) => sum + record.outputTokens,
    0
  );
  const totalTokens = usageRecords.reduce(
    (sum, record) => sum + record.totalTokens,
    0
  );
  const totalCost = usageRecords.reduce(
    (sum, record) => sum + record.estimatedCost,
    0
  );

  // Group by model
  const byModel = usageRecords.reduce(
    (acc, record) => {
      if (!acc[record.model]) {
        acc[record.model] = {
          count: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
        };
      }
      acc[record.model].count++;
      acc[record.model].inputTokens += record.inputTokens;
      acc[record.model].outputTokens += record.outputTokens;
      acc[record.model].totalTokens += record.totalTokens;
      acc[record.model].cost += record.estimatedCost;
      return acc;
    },
    {} as Record<string, any>
  );

  return {
    totalRequests: usageRecords.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    byModel,
    records: usageRecords,
  };
}

/**
 * Get daily usage statistics
 */
export async function getDailyUsageStats(userId?: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: any = {
    createdAt: {
      gte: startDate,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const usageRecords = await prisma.aIUsage.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailyStats = usageRecords.reduce(
    (acc, record) => {
      const date = record.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
        };
      }
      acc[date].requests++;
      acc[date].inputTokens += record.inputTokens;
      acc[date].outputTokens += record.outputTokens;
      acc[date].totalTokens += record.totalTokens;
      acc[date].cost += record.estimatedCost;
      return acc;
    },
    {} as Record<string, any>
  );

  return Object.values(dailyStats);
}
