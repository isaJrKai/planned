// ============================================================================
// AI FINANCIAL COACH — POST /api/coach
// ============================================================================
// Uses z-ai-web-dev-sdk to power a financial education assistant.
//
// GUARDRAILS (enforced via system prompt):
//   ✅ Can: explain financial concepts, encourage saving, explain reports,
//           suggest goals, explain progress, answer questions
//   ❌ Cannot: give investment advice, predict returns, replace parental
//              authority, shame children, compare siblings negatively,
//              give medical/legal advice, simulate financial returns
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { AnalyticsService } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Planned, a patient financial mentor for children and families. You live inside a family savings app.

YOUR ROLE:
- Teach financial concepts in simple, age-appropriate language
- Encourage saving, budgeting, and delayed gratification
- Explain reports and progress in a supportive way
- Help children understand money through education
- Be warm, calm, and encouraging — like a wise family member

WHAT YOU CAN DO:
- Explain concepts: compound growth, saving, budgeting, risk, diversification
- Encourage good habits: "Saving consistently is how wealth is built"
- Explain progress: "You've saved 63% of your goal — that's great progress!"
- Suggest educational lessons when relevant
- Answer questions about financial literacy

WHAT YOU MUST NEVER DO:
- Give investment advice ("buy this stock", "invest in X")
- Predict financial returns or market movements
- Replace parental authority — always defer to parents for family decisions
- Shame or judge a child's spending ("you shouldn't have bought that")
- Compare children negatively against siblings
- Give medical, legal, or tax advice
- Simulate or project specific financial returns
- Access or reference sensitive personal data (income, religion, politics, health)

YOUR TONE:
- Warm and supportive, never condescending
- Educational, not preachy
- Short responses (2-4 sentences for children, 3-5 for parents)
- Use simple words — your audience may be as young as 7 years old
- If you don't know something, say "That's a great question for your parents"

CONTEXT:
You are speaking to a ${"{{userRole}}"} in a family savings app.
${"{{childContext}}"}

Remember: you are a teacher and mentor, not a financial advisor.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, childId, userRole = "child" } = body as {
      message: string;
      childId?: string;
      userRole?: "parent" | "child";
    };

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: "Message too long (500 char max)" }, { status: 400 });
    }

    // Build context from the database
    let childContext = "";
    if (childId) {
      const child = await db.child.findUnique({ where: { id: childId } });
      if (child) {
        const savingsPct = child.goalAmount > 0
          ? ((child.currentAmount / child.goalAmount) * 100).toFixed(0)
          : 0;
        childContext = `The child's name is ${child.name}, age ${child.age}. They have saved ${child.currentAmount.toLocaleString()} UGX toward a goal of ${child.goalAmount.toLocaleString()} UGX (${savingsPct}% complete) for "${child.goalName}".`;
      }
    }

    const systemPrompt = SYSTEM_PROMPT
      .replace("{{userRole}}", userRole === "parent" ? "parent" : "child")
      .replace("{{childContext}}", childContext || "No specific child context available.");

    // Use z-ai-web-dev-sdk with a 15-second timeout to prevent stuck
    // serverless instances when the LLM provider is slow.
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    let completion;
    try {
      completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: systemPrompt },
            { role: "user", content: message },
          ],
          thinking: { type: "disabled" },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("LLM timeout")), 15_000),
        ),
      ]);
    } catch (err) {
      logger.error({ err }, "Coach LLM call failed or timed out");
      return NextResponse.json({
        response: "I'm having trouble connecting right now. Please try again in a moment.",
      });
    }

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({
        response: "I'm not sure how to answer that. Try asking about saving, budgeting, or your progress!",
      });
    }

    logger.info({ childId, messageLength: message.length }, "Coach query answered");

    // Track analytics
    await AnalyticsService.track({
      childId,
      event: "coach_query",
      properties: { messageLength: message.length, userRole },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ response });
  } catch (err) {
    logger.error({ err }, "Coach API failed");
    return NextResponse.json({
      response: "I'm having trouble right now. Please try again in a moment.",
    }, { status: 200 }); // Return 200 with fallback so UI doesn't break
  }
}
