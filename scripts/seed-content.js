const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// Seed lessons (from EducationService)
const SEED_LESSONS = [
  {
    slug: "what-is-saving",
    title: "What Is Saving?",
    description: "Learn the basics of saving money and why it matters.",
    subject: "savings",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 12,
    estimatedMinutes: 8,
    order: 1,
    content: "Saving is like planting a seed. The seed is small, but over time it grows into something much bigger. Every shilling you save is a seed for your future.",
    quiz: JSON.stringify([
      { question: "Saving is like planting a seed because:", options: ["It grows over time", "It costs money", "It is green", "It needs water"], correctIndex: 0, explanation: "A small seed grows into a big tree. In the same way, small savings grow into large amounts over time." }
    ]),
  },
  {
    slug: "needs-vs-wants",
    title: "Needs vs Wants",
    description: "Learn to tell the difference between what you need and what you want.",
    subject: "budgeting",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 14,
    estimatedMinutes: 7,
    order: 2,
    content: "A need is something you must have to live — food, shelter, clothing. A want is something that would be nice to have but you can live without — toys, candy, games.",
    quiz: JSON.stringify([
      { question: "Which of these is a need?", options: ["Ice cream", "School books", "Video game", "Soda"], correctIndex: 1, explanation: "School books help you learn, which is essential for your future." },
      { question: "Which of these is a want?", options: ["Water", "A new phone", "Food", "Shelter"], correctIndex: 1, explanation: "A new phone is nice to have but not essential for survival." }
    ]),
  },
  {
    slug: "compound-growth",
    title: "The Power of Compound Growth",
    description: "Discover how your money can grow faster over time.",
    subject: "investing",
    difficulty: "intermediate",
    ageMin: 10,
    ageMax: 18,
    estimatedMinutes: 10,
    order: 3,
    content: "When you save money and it earns interest, you earn interest on your interest. This creates a snowball effect — your money grows faster and faster over time.",
    quiz: JSON.stringify([
      { question: "Compound growth means:", options: ["You lose money", "You earn interest on interest", "You pay taxes", "You spend less"], correctIndex: 1, explanation: "Compound growth creates a snowball effect — your money grows faster over time." },
      { question: "The longer you save, the:", options: ["Less money you have", "More your money grows", "More you spend", "Less interest you earn"], correctIndex: 1, explanation: "Time is the most powerful factor in compound growth." }
    ]),
  },
  {
    slug: "making-a-budget",
    title: "Making a Budget",
    description: "Learn how to plan your spending.",
    subject: "budgeting",
    difficulty: "beginner",
    ageMin: 8,
    ageMax: 16,
    estimatedMinutes: 9,
    order: 4,
    content: "A budget is a plan for your money. It helps you decide how much to save, how much to spend, and how much to share.",
    quiz: JSON.stringify([
      { question: "A budget is:", options: ["A type of bank", "A plan for your money", "A loan", "A tax"], correctIndex: 1, explanation: "A budget helps you track and plan your income and expenses." }
    ]),
  },
  {
    slug: "understanding-risk",
    title: "Understanding Risk",
    description: "Learn about different types of financial risk.",
    subject: "investing",
    difficulty: "intermediate",
    ageMin: 11,
    ageMax: 18,
    estimatedMinutes: 8,
    order: 5,
    content: "Every investment has some risk. The key is to understand the risk and decide if you're comfortable with it. Higher potential returns usually come with higher risk.",
    quiz: JSON.stringify([
      { question: "Higher potential returns usually mean:", options: ["Lower risk", "Higher risk", "No risk", "Guaranteed profit"], correctIndex: 1, explanation: "There is always a trade-off between risk and reward." }
    ]),
  },
  {
    slug: "delayed-gratification",
    title: "Delayed Gratification",
    description: "Learn why waiting can lead to better rewards.",
    subject: "psychology",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 16,
    estimatedMinutes: 7,
    order: 6,
    content: "Delayed gratification means giving up something now to get something better later. It's one of the most important skills for financial success.",
    quiz: JSON.stringify([
      { question: "Delayed gratification means:", options: ["Buying now, paying later", "Waiting for a better reward", "Never spending money", "Borrowing money"], correctIndex: 1, explanation: "Waiting often leads to bigger and better rewards." }
    ]),
  },
];

// Seed achievements
const SEED_ACHIEVEMENTS = [
  { slug: "first-steps", title: "First Steps", description: "Complete your first savings deposit", category: "savings", tier: "bronze", points: 10, icon: "🌱", requirement: JSON.stringify({ type: "first_save" }) },
  { slug: "consistent-saver", title: "Consistent Saver", description: "Save for 7 days in a row", category: "savings", tier: "silver", points: 50, icon: "📈", requirement: JSON.stringify({ type: "streak", days: 7 }) },
  { slug: "unbreakable", title: "Unbreakable", description: "Save for 30 days in a row", category: "savings", tier: "gold", points: 200, icon: "🔥", requirement: JSON.stringify({ type: "streak", days: 30 }) },
  { slug: "goal-achieved", title: "Goal Achieved", description: "Complete your first savings goal", category: "goals", tier: "bronze", points: 25, icon: "🎯", requirement: JSON.stringify({ type: "goal_completed", count: 1 }) },
  { slug: "goal-master", title: "Goal Master", description: "Complete 3 savings goals", category: "goals", tier: "silver", points: 100, icon: "🏆", requirement: JSON.stringify({ type: "goal_completed", count: 3 }) },
  { slug: "curious-mind", title: "Curious Mind", description: "Complete your first lesson", category: "education", tier: "bronze", points: 15, icon: "📖", requirement: JSON.stringify({ type: "lessons_completed", count: 1 }) },
  { slug: "financial-scholar", title: "Financial Scholar", description: "Complete 5 lessons", category: "education", tier: "silver", points: 75, icon: "🎓", requirement: JSON.stringify({ type: "lessons_completed", count: 5 }) },
  { slug: "budget-keeper", title: "Budget Keeper", description: "Log spending for 7 days", category: "spending", tier: "bronze", points: 20, icon: "💰", requirement: JSON.stringify({ type: "spending_logged", days: 7 }) },
  { slug: "token-redeemer", title: "Token Redeemer", description: "Redeem your first token", category: "tokens", tier: "bronze", points: 10, icon: "⭐", requirement: JSON.stringify({ type: "tokens_redeemed", count: 1 }) },
  { slug: "first-investor", title: "First Investor", description: "Make your first investment", category: "investments", tier: "bronze", points: 30, icon: "📊", requirement: JSON.stringify({ type: "first_investment" }) },
];

async function seed() {
  console.log('=== Seeding lessons ===');
  for (const lesson of SEED_LESSONS) {
    await db.lesson.upsert({
      where: { slug: lesson.slug },
      update: lesson,
      create: lesson,
    });
    console.log('  ✓', lesson.title);
  }
  console.log(`  Total lessons: ${SEED_LESSONS.length}`);

  console.log('\n=== Seeding achievements ===');
  for (const ach of SEED_ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { slug: ach.slug },
      update: ach,
      create: ach,
    });
    console.log('  ✓', ach.title, ach.icon);
  }
  console.log(`  Total achievements: ${SEED_ACHIEVEMENTS.length}`);

  // Verify
  const lessonCount = await db.lesson.count();
  const achCount = await db.achievement.count();
  console.log(`\n✅ Seeded: ${lessonCount} lessons, ${achCount} achievements`);

  await db.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
