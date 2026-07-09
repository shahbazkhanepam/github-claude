import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/usage-tracker";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserUsageStats(session.userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get user usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
