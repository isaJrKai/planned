import { InsightsEngine } from "@/server/services/insights.service";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const insights = await InsightsEngine.generateForFamily();
    return apiResponse({ insights: insights.map(i => ({
      id: i.id, type: i.type, priority: i.priority, title: i.title,
      body: i.body, why: i.why, confidence: i.confidence, childName: i.childName,
    }))});
  } catch { return apiError("Failed to fetch insights", 500); }
}
