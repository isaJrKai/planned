// @ts-nocheck — dead code
// GET /api/charter — get family charter
// PUT /api/charter — update family charter (creates new version)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let charter: any = null;
    try {
      charter = await db.familyCharter.findFirst({
        where: { familyId: "singleton" },
        orderBy: { version: "desc" },
      });
    } catch {
      const rows = await db.$queryRaw`SELECT * FROM FamilyCharter WHERE familyId = 'singleton' ORDER BY version DESC LIMIT 1`;
      charter = (rows as any[])[0] ?? null;
    }

    if (!charter) {
      return NextResponse.json({ charter: null });
    }

    return NextResponse.json({
      charter: {
        id: charter.id,
        version: charter.version,
        mission: charter.mission,
        savingPrinciples: charter.savingPrinciples,
        spendingPrinciples: charter.spendingPrinciples,
        goalPrinciples: charter.goalPrinciples,
        investmentPrinciples: charter.investmentPrinciples,
        houseRules: charter.houseRules,
        sharedCommitments: charter.sharedCommitments,
        updatedAt: charter.updatedAt instanceof Date ? charter.updatedAt.toISOString() : charter.updatedAt,
      },
    });
  } catch (err) {
    console.error("GET /api/charter failed:", err);
    return NextResponse.json({ charter: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Get current version
    let current: any = null;
    try {
      current = await db.familyCharter.findFirst({
        where: { familyId: "singleton" },
        orderBy: { version: "desc" },
      });
    } catch {
      const rows = await db.$queryRaw`SELECT * FROM FamilyCharter WHERE familyId = 'singleton' ORDER BY version DESC LIMIT 1`;
      current = (rows as any[])[0] ?? null;
    }

    const newVersion = (current?.version ?? 0) + 1;

    let created: any;
    try {
      created = await db.familyCharter.create({
        data: {
          familyId: "singleton",
          version: newVersion,
          mission: body.mission ?? "",
          savingPrinciples: body.savingPrinciples ?? "",
          spendingPrinciples: body.spendingPrinciples ?? "",
          goalPrinciples: body.goalPrinciples ?? "",
          investmentPrinciples: body.investmentPrinciples ?? "",
          houseRules: body.houseRules ?? "",
          sharedCommitments: body.sharedCommitments ?? "",
        },
      });
    } catch {
      await db.$executeRaw`INSERT INTO FamilyCharter (id, familyId, version, mission, savingPrinciples, spendingPrinciples, goalPrinciples, investmentPrinciples, houseRules, sharedCommitments, createdAt, updatedAt)
        VALUES (${crypto.randomUUID()}, 'singleton', ${newVersion}, ${body.mission ?? ""}, ${body.savingPrinciples ?? ""}, ${body.spendingPrinciples ?? ""}, ${body.goalPrinciples ?? ""}, ${body.investmentPrinciples ?? ""}, ${body.houseRules ?? ""}, ${body.sharedCommitments ?? ""}, datetime('now'), datetime('now'))`;
      const rows = await db.$queryRaw`SELECT * FROM FamilyCharter WHERE familyId = 'singleton' ORDER BY version DESC LIMIT 1`;
      created = (rows as any[])[0];
    }

    return NextResponse.json({ ok: true, version: newVersion });
  } catch (err) {
    console.error("PUT /api/charter failed:", err);
    return NextResponse.json({ error: "Failed to update charter" }, { status: 500 });
  }
}
