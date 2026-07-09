# AI Usage Tracking Documentation

## Overview

Your UIGen project now has comprehensive AI usage tracking implemented! This tracks all interactions with the Anthropic Claude API, including token usage, costs, and performance metrics.

## 📊 What's Tracked

### Metrics Captured:
- **Input Tokens**: Number of tokens in prompts sent to the AI
- **Output Tokens**: Number of tokens in AI responses
- **Total Tokens**: Sum of input and output tokens
- **Estimated Cost**: Calculated based on Anthropic's pricing
- **Duration**: Time taken for each request (milliseconds)
- **Model**: Which Claude model was used
- **Status**: Success, error, or partial completion
- **Metadata**: Additional context (finish reason, step count, etc.)

### Per-Request Tracking:
- User ID (if authenticated)
- Project ID (if working on a saved project)
- Timestamp
- Error messages (if any)

## 🗄️ Database Schema

```prisma
model AIUsage {
  id             String   @id @default(cuid())
  userId         String?
  projectId      String?
  model          String
  inputTokens    Int      @default(0)
  outputTokens   Int      @default(0)
  totalTokens    Int      @default(0)
  estimatedCost  Float    @default(0)
  duration       Int?
  status         String   @default("success")
  errorMessage   String?
  metadata       String   @default("{}")
  createdAt      DateTime @default(now())
  
  user           User?    @relation(fields: [userId], references: [id])
  project        Project? @relation(fields: [projectId], references: [id])
  
  @@index([userId])
  @@index([projectId])
  @@index([createdAt])
}
```

## 💰 Pricing Model

Current pricing (as of 2025) for Anthropic Claude models:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Mock Provider | $0.00 | $0.00 |

*Costs are automatically calculated based on actual token usage.*

## 🔧 Implementation

### 1. Automatic Tracking

Every AI request is automatically tracked in the `/api/chat` endpoint:

```typescript
import { trackUsage } from "@/lib/usage-tracker";

// In onFinish callback
await trackUsage({
  model: "claude-haiku-4-5",
  inputTokens: usage?.promptTokens || 0,
  outputTokens: usage?.completionTokens || 0,
  totalTokens: usage?.totalTokens || 0,
  duration: Date.now() - startTime,
  userId: session?.userId,
  projectId,
  status: "success",
});
```

### 2. API Endpoints

Three new API endpoints for querying usage data:

#### Get User Statistics
```bash
GET /api/usage/user
Authorization: Required (session cookie)
```

Response:
```json
{
  "totalRequests": 42,
  "totalInputTokens": 15234,
  "totalOutputTokens": 8901,
  "totalTokens": 24135,
  "totalCost": 0.0483,
  "recentUsage": [...]
}
```

#### Get Project Statistics
```bash
GET /api/usage/project/[projectId]
Authorization: Required (session cookie)
```

#### Get Daily Statistics
```bash
GET /api/usage/daily?days=30
Authorization: Required (session cookie)
```

Response:
```json
[
  {
    "date": "2025-07-08",
    "requests": 5,
    "inputTokens": 2345,
    "outputTokens": 1234,
    "totalTokens": 3579,
    "cost": 0.0072
  },
  ...
]
```

### 3. UI Dashboard

Visit `/usage` (when logged in) to see your usage dashboard with:
- Total requests and tokens
- Estimated costs
- 7-day usage chart
- Recent activity log

## 📚 Usage Examples

### Track Custom Usage
```typescript
import { trackUsage } from "@/lib/usage-tracker";

await trackUsage({
  model: "claude-haiku-4-5",
  inputTokens: 1000,
  outputTokens: 500,
  totalTokens: 1500,
  userId: "user_123",
  projectId: "project_456",
  metadata: {
    feature: "custom-generation",
    version: "2.0"
  }
});
```

### Get Statistics Programmatically
```typescript
import { 
  getUserUsageStats,
  getProjectUsageStats,
  getDailyUsageStats 
} from "@/lib/usage-tracker";

// User stats
const userStats = await getUserUsageStats("user_123");

// Project stats
const projectStats = await getProjectUsageStats("project_456");

// Daily stats for last 30 days
const dailyStats = await getDailyUsageStats("user_123", 30);

// Period stats
import { getUsageStatsForPeriod } from "@/lib/usage-tracker";
const periodStats = await getUsageStatsForPeriod(
  new Date("2025-07-01"),
  new Date("2025-07-31"),
  "user_123"
);
```

### Calculate Custom Costs
```typescript
import { calculateCost } from "@/lib/usage-tracker";

const cost = calculateCost(
  "claude-haiku-4-5",
  1000,  // input tokens
  500    // output tokens
);
// Returns: 0.0028
```

## 🔍 Querying Usage Data

### SQL Queries (via Prisma)

```typescript
// Get all usage for a user
const usage = await prisma.aIUsage.findMany({
  where: { userId: "user_123" },
  orderBy: { createdAt: "desc" }
});

// Get usage with errors
const errors = await prisma.aIUsage.findMany({
  where: { 
    status: "error",
    userId: "user_123"
  }
});

// Get expensive requests
const expensive = await prisma.aIUsage.findMany({
  where: {
    estimatedCost: { gt: 0.01 }
  },
  orderBy: { estimatedCost: "desc" },
  take: 10
});

// Aggregate statistics
const aggregated = await prisma.aIUsage.aggregate({
  where: { userId: "user_123" },
  _sum: {
    inputTokens: true,
    outputTokens: true,
    totalTokens: true,
    estimatedCost: true
  },
  _avg: {
    duration: true
  },
  _count: true
});
```

## 🎨 UI Components

### UsageStats Component

Located at `src/components/usage/UsageStats.tsx`

Features:
- Real-time statistics display
- 7-day usage chart
- Recent activity feed
- Responsive design
- Loading states
- Error handling

Usage:
```tsx
import { UsageStats } from "@/components/usage/UsageStats";

export default function DashboardPage() {
  return (
    <div>
      <h1>My Dashboard</h1>
      <UsageStats />
    </div>
  );
}
```

## 🔐 Security & Privacy

### Access Control
- All usage endpoints require authentication
- Users can only see their own usage data
- Project usage requires project ownership verification

### Data Retention
- Usage records are stored indefinitely by default
- Cascade delete: When a user is deleted, their usage records are deleted
- When a project is deleted, associated usage records are deleted

### Anonymous Users
- Anonymous users' usage is tracked without a userId
- Data is associated with projects (session-based)
- Not included in user statistics

## 📈 Monitoring & Alerts

### Set Up Custom Alerts

You can create alerts based on usage thresholds:

```typescript
// Example: Alert when daily cost exceeds $1
const stats = await getDailyUsageStats(userId, 1);
const todayStats = stats[stats.length - 1];

if (todayStats && todayStats.cost > 1.0) {
  // Send alert email/notification
  console.warn(`High usage alert: $${todayStats.cost}`);
}
```

### Monitoring Best Practices

1. **Set Budget Limits**
   - Monitor daily/monthly spending
   - Set up automated alerts

2. **Track Failed Requests**
   - Monitor error rates
   - Investigate patterns

3. **Analyze Token Efficiency**
   - Compare input vs output tokens
   - Optimize prompts

4. **Performance Monitoring**
   - Track request duration
   - Identify slow requests

## 🚀 Next Steps

### Recommended Enhancements:

1. **Export Functionality**
   - Add CSV/JSON export for usage data
   - Generate monthly reports

2. **Budget Alerts**
   - Email notifications for budget thresholds
   - Automatic request throttling

3. **Analytics Dashboard**
   - Charts and graphs using Chart.js/Recharts
   - Model comparison metrics
   - Usage trends over time

4. **Cost Optimization**
   - Identify expensive prompts
   - Suggest optimizations
   - Cache frequent requests

5. **Admin Panel**
   - View all users' usage
   - Set per-user limits
   - Monitor system health

## 🐛 Troubleshooting

### Common Issues:

**Issue: Usage not being tracked**
- Check that the database migration was successful
- Verify Prisma Client is generated
- Check console for errors

**Issue: Cost calculations seem wrong**
- Verify pricing constants in `src/lib/usage-tracker.ts`
- Check Anthropic's current pricing
- Ensure token counts are accurate

**Issue: UI not loading**
- Verify user is authenticated
- Check API endpoints are accessible
- Look for JavaScript console errors

## 📝 Testing

### Test Usage Tracking

1. Make some AI requests in the app
2. Visit `/usage` to see statistics
3. Check database:
   ```bash
   npx prisma studio
   ```
4. Query API directly:
   ```bash
   curl http://localhost:3000/api/usage/user \
     -H "Cookie: session=YOUR_SESSION_TOKEN"
   ```

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review code in `src/lib/usage-tracker.ts`
3. Inspect database schema in `prisma/schema.prisma`
4. Check API routes in `src/app/api/usage/`

---

## ✅ Summary

You now have a complete AI usage tracking system that:
- ✅ Automatically tracks all AI requests
- ✅ Calculates accurate costs
- ✅ Provides detailed statistics
- ✅ Includes a user-friendly dashboard
- ✅ Supports both authenticated and anonymous users
- ✅ Offers flexible querying capabilities

**Your usage tracking is ready to use!** 🎉
