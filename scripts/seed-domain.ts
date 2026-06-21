// Seed achievements + lessons into the database
import { AchievementService } from "../src/server/services/achievement.service";
import { EducationService } from "../src/server/services/education.service";
import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding domain data...");
  await AchievementService.seedAchievements();
  await EducationService.seedLessons();

  // Also seed a default parent user (for MVP — no auth yet)
  const existingUser = await db.user.findFirst({ where: { role: "PARENT" } });
  if (!existingUser) {
    await db.user.create({
      data: {
        email: "parent@planned.app",
        name: "Parent",
        role: "PARENT",
        familyId: "singleton",
      },
    });
    console.log("  ✓ Created default parent user");
  }

  console.log("\n✅ Domain seed complete.");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
