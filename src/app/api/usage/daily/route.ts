import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDailyUsageStats } from "@/lib/usage-tracker";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const stats = await getDailyUsageStats(session.userId, days);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get daily usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
