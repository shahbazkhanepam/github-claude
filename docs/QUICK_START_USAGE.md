# 🎯 Quick Start: AI Usage Tracking

## 🚀 5-Minute Setup Guide

### ✅ Already Done For You:
1. ✅ Database schema updated
2. ✅ Tracking system implemented
3. ✅ API endpoints created
4. ✅ UI dashboard built
5. ✅ Navigation added

---

## 📊 View Your Usage (3 Steps)

### Step 1: Sign In
- Go to http://localhost:3000
- Click "Sign In" or "Sign Up"
- Enter your credentials

### Step 2: Generate Something
- Type a prompt: "Create a button component"
- Wait for the AI to generate code
- This will be tracked automatically! ✨

### Step 3: View Statistics
Click the **📊 chart icon** in the header (top-right)
or visit: http://localhost:3000/usage

---

## 💡 What You'll See

### Dashboard Overview:
```
┌─────────────────────────────────────────────────────┐
│  AI Usage Statistics                                │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Total  │ │  Input  │ │ Output  │ │  Cost   │  │
│  │Requests │ │ Tokens  │ │ Tokens  │ │         │  │
│  │   42    │ │ 15,234  │ │  8,901  │ │ $0.048  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
├─────────────────────────────────────────────────────┤
│  Last 7 Days                                        │
│  Date       | Requests | Tokens | Cost             │
│  ─────────────────────────────────────────────────  │
│  2025-07-08 |    5     | 7,000  | $0.0148          │
│  2025-07-07 |    8     | 9,500  | $0.0201          │
├─────────────────────────────────────────────────────┤
│  Recent Activity                                    │
│  claude-haiku-4-5 | 1,370 tokens | $0.0029         │
│  Jul 8, 10:00 PM                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 For Developers

### Access Stats Programmatically:

```typescript
// Get user stats
const stats = await getUserUsageStats(userId);

// Get project stats
const projectStats = await getProjectUsageStats(projectId);

// Get daily breakdown
const daily = await getDailyUsageStats(userId, 30);
```

### Query via API:

```bash
# User stats
curl http://localhost:3000/api/usage/user \
  -H "Cookie: session=YOUR_SESSION"

# Daily stats
curl http://localhost:3000/api/usage/daily?days=7 \
  -H "Cookie: session=YOUR_SESSION"

# Project stats
curl http://localhost:3000/api/usage/project/PROJECT_ID \
  -H "Cookie: session=YOUR_SESSION"
```

---

## 📈 Understanding Costs

### Pricing per 1 Million Tokens:

| Model | Input | Output |
|-------|-------|--------|
| Claude Haiku 4.5 | $0.80 | $4.00 |

### Example Calculation:
```
Input:  1,000 tokens × $0.80 / 1,000,000 = $0.0008
Output:   500 tokens × $4.00 / 1,000,000 = $0.0020
Total:                                    = $0.0028
```

---

## 🎯 Common Use Cases

### 1. Check Your Spending
Visit `/usage` to see total cost

### 2. Monitor Project Costs
Each project tracks its own usage

### 3. Track Token Efficiency
Compare input vs output tokens

### 4. Identify Expensive Requests
See which prompts cost the most

---

## 🛠️ Troubleshooting

### Not seeing usage?
1. Make sure you're signed in
2. Generate at least one component
3. Refresh the usage page

### Numbers seem wrong?
1. Check Anthropic's current pricing
2. Verify token counts in database
3. Review `src/lib/usage-tracker.ts`

### UI not loading?
1. Check browser console for errors
2. Verify API endpoints are working
3. Check authentication

---

## 📚 More Information

### Full Documentation:
- `docs/AI_USAGE_TRACKING.md` - Complete guide
- `docs/USAGE_TRACKING_SUMMARY.md` - Implementation details
- `src/lib/usage-tracker.ts` - Source code

### Files to Customize:
- `src/components/usage/UsageStats.tsx` - UI component
- `src/lib/usage-tracker.ts` - Tracking logic
- `prisma/schema.prisma` - Database schema

---

## ✨ That's It!

Your usage tracking is ready to go. Just:
1. Sign in
2. Use the AI
3. Check your stats

**Simple as that!** 🎉
