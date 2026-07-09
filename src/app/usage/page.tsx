import { UsageStats } from "@/components/usage/UsageStats";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsagePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <UsageStats />
      </div>
    </div>
  );
}
