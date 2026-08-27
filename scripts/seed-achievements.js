const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const ACHIEVEMENTS = [
  { code: "FIRST_SAVE", title: "First Steps", description: "Complete your first savings deposit", category: "savings", tier: "bronze", points: 10, icon: "sprout", requirement: JSON.stringify({ type: "first_save" }) },
  { code: "STREAK_7", title: "Consistent Saver", description: "Save for 7 days in a row", category: "savings", tier: "silver", points: 50, icon: "trending-up", requirement: JSON.stringify({ type: "streak", days: 7 }) },
  { code: "STREAK_30", title: "Unbreakable", description: "Save for 30 days in a row", category: "savings", tier: "gold", points: 200, icon: "flame", requirement: JSON.stringify({ type: "streak", days: 30 }) },
  { code: "GOAL_COMPLETED_1", title: "Goal Achieved", description: "Complete your first savings goal", category: "goals", tier: "bronze", points: 25, icon: "target", requirement: JSON.stringify({ type: "goal_completed", count: 1 }) },
  { code: "GOAL_COMPLETED_3", title: "Goal Master", description: "Complete 3 savings goals", category: "goals", tier: "silver", points: 100, icon: "trophy", requirement: JSON.stringify({ type: "goal_completed", count: 3 }) },
  { code: "LESSON_COMPLETED_1", title: "Curious Mind", description: "Complete your first lesson", category: "education", tier: "bronze", points: 15, icon: "book-open", requirement: JSON.stringify({ type: "lessons_completed", count: 1 }) },
  { code: "LESSON_COMPLETED_5", title: "Financial Scholar", description: "Complete 5 lessons", category: "education", tier: "silver", points: 75, icon: "graduation-cap", requirement: JSON.stringify({ type: "lessons_completed", count: 5 }) },
  { code: "SPENDING_LOGGED_7", title: "Budget Keeper", description: "Log spending for 7 days", category: "spending", tier: "bronze", points: 20, icon: "wallet", requirement: JSON.stringify({ type: "spending_logged", days: 7 }) },
  { code: "TOKEN_REDEEMED_1", title: "Token Redeemer", description: "Redeem your first token", category: "tokens", tier: "bronze", points: 10, icon: "star", requirement: JSON.stringify({ type: "tokens_redeemed", count: 1 }) },
  { code: "FIRST_INVESTMENT", title: "First Investor", description: "Make your first investment", category: "investments", tier: "bronze", points: 30, icon: "bar-chart-2", requirement: JSON.stringify({ type: "first_investment" }) },
];

async function seed() {
  console.log('=== Seeding achievements ===');
  for (const ach of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
    console.log('  ✓', ach.title);
  }
  const count = await db.achievement.count();
  console.log(`\n✅ Seeded: ${count} achievements`);
  await db.$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
