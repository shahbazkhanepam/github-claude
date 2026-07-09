import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectUsageStats } from "@/lib/usage-tracker";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getProjectUsageStats(params.projectId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get project usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
