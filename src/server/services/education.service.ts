// ============================================================================
// EDUCATION SERVICE
// ============================================================================
// Financial literacy lessons with quizzes, progress tracking, and learning
// paths. Content is age-appropriate and covers:
//   saving, budgeting, investing, risk, compound growth, delayed gratification
// ============================================================================

import { db } from "@/lib/db";
import { publish } from "@/server/domain/events";
import { logger } from "@/lib/logger";
import { AchievementService } from "./achievement.service";

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  ageMin: number;
  ageMax: number;
  estimatedMinutes: number;
  content: string;
  quiz: QuizQuestion[];
  order: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonWithProgress extends Lesson {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  completedAt?: number;
}

// ---- Seed lessons ----------------------------------------------------------

export const SEED_LESSONS: Omit<Lesson, "id">[] = [
  {
    slug: "what-is-saving",
    title: "What Is Saving?",
    description: "Learn why saving money is the foundation of wealth-building.",
    subject: "saving",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 12,
    estimatedMinutes: 8,
    order: 1,
    content: `# What Is Saving?

Saving means keeping some of your money for the future instead of spending it all right now.

## Why Do We Save?

We save because the future is uncertain. You might need money for:
- Something you want to buy (a bicycle, a tablet, school supplies)
- An emergency (something breaks and needs fixing)
- A big dream (going to university, starting a business)

## The Golden Rule

**Save before you spend.** When you get money, the first thing you should do is put some aside for saving. Then you can spend what is left.

This is different from what most people do — they spend first and save whatever is left. But if you spend first, there is usually nothing left to save!

## How Much Should I Save?

A good rule is to save at least **10%** of any money you receive. So if you get 10,000 shillings, save at least 1,000.

## Think About It

Saving is like planting a seed. The seed is small, but over time it grows into something much bigger. Every shilling you save is a seed for your future.`,
    quiz: [
      {
        question: "Why is it better to save before you spend?",
        options: [
          "Because banks require it",
          "Because if you spend first, there's usually nothing left to save",
          "Because spending is bad",
          "Because your parents tell you to",
        ],
        correctIndex: 1,
        explanation: "When you spend first, the money disappears quickly. Saving first ensures you always put something aside for your future.",
      },
      {
        question: "What is a good rule for how much to save?",
        options: [
          "Save 1% of your money",
          "Save 50% of your money",
          "Save at least 10% of your money",
          "Save whatever is left over",
        ],
        correctIndex: 2,
        explanation: "Saving at least 10% is a good starting rule. So if you get 10,000 shillings, save at least 1,000.",
      },
      {
        question: "Saving is like planting a seed because:",
        options: [
          "Both are green",
          "Both start small but grow into something bigger over time",
          "Both need water",
          "Both are difficult",
        ],
        correctIndex: 1,
        explanation: "A small seed grows into a big tree. In the same way, small savings grow into large amounts over time.",
      },
    ],
  },
  {
    slug: "needs-vs-wants",
    title: "Needs vs Wants",
    description: "Learn the difference between what you need and what you want.",
    subject: "budgeting",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 14,
    estimatedMinutes: 7,
    order: 2,
    content: `# Needs vs Wants

One of the most important money skills is knowing the difference between a **need** and a **want**.

## What Is a Need?

A need is something you must have to live and be healthy:
- Food
- Water
- Shelter (a place to live)
- Basic clothing
- Education
- Medicine when you are sick

## What Is a Want?

A want is something that would be nice to have, but you can live without:
- Snacks and sweets
- Toys and games
- The newest phone
- Brand-name clothes
- Entertainment

## Why Does This Matter?

When you know the difference, you can make better choices with your money. You take care of your **needs first**, then you decide which **wants** are worth spending on.

## The Test

Before you buy something, ask yourself:
1. Do I **need** this, or do I **want** this?
2. If I don't buy this, will I be okay?
3. Is there something I need more than this?

If the answer is "I want it but I'll be okay without it," then it's a want. That doesn't mean you should never buy wants — but you should take care of needs first.

## Think About It

It's okay to buy things you want. But if you spend all your money on wants, you might not have enough for what you truly need.`,
    quiz: [
      {
        question: "Which of these is a NEED?",
        options: ["A new video game", "Food", "A cinema ticket", "Brand-name shoes"],
        correctIndex: 1,
        explanation: "Food is something you must have to live. The others are wants — nice to have but not essential.",
      },
      {
        question: "Before buying something, you should ask:",
        options: [
          "Will my friends be impressed?",
          "Is this the cheapest option?",
          "Do I need this, or do I want this?",
          "Can I buy two?",
        ],
        correctIndex: 2,
        explanation: "Asking 'need or want?' helps you make smart spending decisions and prioritize what matters most.",
      },
    ],
  },
  {
    slug: "power-of-compound-growth",
    title: "The Power of Compound Growth",
    description: "Discover how small savings grow exponentially over time.",
    subject: "compound_growth",
    difficulty: "intermediate",
    ageMin: 10,
    ageMax: 18,
    estimatedMinutes: 10,
    order: 3,
    content: `# The Power of Compound Growth

Compound growth is one of the most powerful forces in finance. Albert Einstein supposedly called it "the eighth wonder of the world."

## What Is Compound Growth?

When you save money and it earns interest, you earn interest on your interest. This creates a snowball effect — your money grows faster and faster over time.

## A Story

Imagine you save 1,000 shillings and it earns 10% interest per year.

- **Year 1:** You have 1,000 + 100 (10% interest) = **1,100**
- **Year 2:** You earn 10% on 1,100 = 110. Now you have **1,210**
- **Year 3:** You earn 10% on 1,210 = 121. Now you have **1,331**
- **Year 10:** You would have **2,594** — more than double!

The longer you leave your money, the faster it grows. This is why starting to save early is so important.

## The Rule of 72

A quick way to estimate how long it takes for money to double: divide 72 by the interest rate.

- At 10% interest: 72 ÷ 10 = **7.2 years** to double
- At 6% interest: 72 ÷ 6 = **12 years** to double

## Why Starting Early Matters

If you start saving at age 10 and save just 500 shillings per month at 10% interest:
- By age 20: you'd have about **102,000**
- By age 30: you'd have about **378,000**
- By age 60: you'd have about **18,700,000**

The earlier you start, the more time compound growth has to work its magic.

## Think About It

Time is more important than amount. A small amount saved early can grow larger than a big amount saved late. Start now, even if it's small.`,
    quiz: [
      {
        question: "Compound growth means:",
        options: [
          "Your money doubles every year",
          "You earn interest on your interest",
          "Your money is guaranteed to grow",
          "The bank gives you free money",
        ],
        correctIndex: 1,
        explanation: "Compound growth means you earn returns on your previous returns, creating exponential growth over time.",
      },
      {
        question: "Using the Rule of 72, how long does it take money to double at 8% interest?",
        options: ["6 years", "8 years", "9 years", "12 years"],
        correctIndex: 2,
        explanation: "72 ÷ 8 = 9 years. The Rule of 72 gives a quick estimate of doubling time.",
      },
      {
        question: "Why is starting to save early better than saving more later?",
        options: [
          "Because young people get better interest rates",
          "Because compound growth needs time to work",
          "Because banks prefer young customers",
          "It doesn't matter when you start",
        ],
        correctIndex: 1,
        explanation: "Time is the most important factor in compound growth. The longer your money has to grow, the more it multiplies.",
      },
    ],
  },
  {
    slug: "making-a-budget",
    title: "Making a Budget",
    description: "Learn how to plan your spending so you always have enough.",
    subject: "budgeting",
    difficulty: "beginner",
    ageMin: 8,
    ageMax: 16,
    estimatedMinutes: 9,
    order: 4,
    content: `# Making a Budget

A budget is a plan for your money. It tells you **where your money will go** before you spend it, instead of wondering **where it went** after it's gone.

## The Three Jars Method

Imagine you have three jars:
1. **Save jar** — for your future (at least 10%)
2. **Spend jar** — for things you need and want now
3. **Share jar** — for helping others (optional, but good)

When you get money, split it across the jars. For example, if you get 10,000 shillings:
- Save: 1,000 (10%)
- Spend: 8,000 (80%)
- Share: 1,000 (10%)

## Tracking Your Spending

A budget only works if you track what you actually spend. Write down every purchase, no matter how small. You might be surprised where your money goes!

## Categories

Group your spending into categories:
- **Snacks & Food**
- **Transport**
- **School supplies**
- **Entertainment**
- **Gifts**

At the end of the month, look at each category. Did you spend more than you planned? Where can you cut back?

## The 24-Hour Rule

If you want to buy something that costs more than a certain amount (say 5,000 shillings), wait 24 hours before buying it. If you still want it the next day, buy it. Often, the urge to buy passes and you realize you don't really need it.

## Think About It

A budget isn't about restricting yourself — it's about making sure your money goes toward what matters most to you. When you have a plan, you feel in control.`,
    quiz: [
      {
        question: "What is a budget?",
        options: [
          "A list of things you want to buy",
          "A plan for where your money will go before you spend it",
          "A bank account",
          "A type of savings",
        ],
        correctIndex: 1,
        explanation: "A budget is simply a plan. It helps you decide in advance how to use your money, rather than spending without thinking.",
      },
      {
        question: "What is the 24-hour rule?",
        options: [
          "You must save for 24 hours before spending",
          "Wait 24 hours before buying something expensive, to see if you still want it",
          "You can only spend money every 24 hours",
          "Banks close after 24 hours",
        ],
        correctIndex: 1,
        explanation: "Waiting 24 hours gives you time to think. Often, impulse desires fade and you realize you don't need the item.",
      },
      {
        question: "Why should you track your spending?",
        options: [
          "Because the government requires it",
          "To see where your money actually goes and find areas to improve",
          "To impress your friends",
          "Tracking spending is not important",
        ],
        correctIndex: 1,
        explanation: "You might be surprised where your money goes. Tracking helps you identify waste and redirect money toward your goals.",
      },
    ],
  },
  {
    slug: "understanding-risk",
    title: "Understanding Risk",
    description: "Learn why higher rewards usually come with higher risks.",
    subject: "risk",
    difficulty: "intermediate",
    ageMin: 11,
    ageMax: 18,
    estimatedMinutes: 8,
    order: 5,
    content: `# Understanding Risk

In finance, **risk** means the chance that you could lose some or all of your money. Understanding risk is essential to making smart financial decisions.

## Risk vs Reward

The golden rule of investing is: **higher potential reward usually means higher risk.**

- A savings account at the bank: very low risk, but also very low reward (small interest)
- Government bonds: low risk, moderate reward
- Stocks: higher risk, potentially higher reward
- Starting a business: highest risk, potentially highest reward

## Types of Risk

1. **Loss of principal** — you could lose the money you invested
2. **Inflation risk** — your money loses value over time because things get more expensive
3. **Liquidity risk** — you can't access your money when you need it

## Diversification

"Don't put all your eggs in one basket." This old saying is the key to managing risk.

If you put all your money in one investment and it fails, you lose everything. But if you spread your money across many different investments, a loss in one can be offset by gains in others.

## Risk Tolerance

Your **risk tolerance** is how much risk you can afford to take. It depends on:
- Your **age** — younger people can take more risk because they have time to recover
- Your **goals** — if you need the money soon, take less risk
- Your **personality** — some people worry more than others

## Think About It

Risk isn't something to avoid — it's something to understand and manage. The goal isn't to eliminate risk, but to take **smart risks** that are worth the potential reward.`,
    quiz: [
      {
        question: "The relationship between risk and reward is:",
        options: [
          "Higher risk always means higher reward",
          "Higher potential reward usually comes with higher risk",
          "Low risk always gives the best reward",
          "There is no relationship",
        ],
        correctIndex: 1,
        explanation: "Higher potential rewards usually require taking on more risk. The key word is 'potential' — higher risk doesn't guarantee higher reward.",
      },
      {
        question: "What does 'diversification' mean?",
        options: [
          "Putting all your money in one investment",
          "Spreading your money across different investments to reduce risk",
          "Only investing in banks",
          "Buying many of the same thing",
        ],
        correctIndex: 1,
        explanation: "Diversification means spreading your investments so that a loss in one can be offset by gains in others. Don't put all your eggs in one basket.",
      },
      {
        question: "Who can typically afford to take more investment risk?",
        options: [
          "Older people who are retired",
          "Younger people who have time to recover from losses",
          "People who worry a lot",
          "Everyone should take the same risk",
        ],
        correctIndex: 1,
        explanation: "Younger people have more time to recover from losses, so they can typically afford higher-risk (and potentially higher-reward) investments.",
      },
    ],
  },
  {
    slug: "delayed-gratification",
    title: "Delayed Gratification",
    description: "Learn why waiting for what you want leads to bigger rewards.",
    subject: "delayed_gratification",
    difficulty: "beginner",
    ageMin: 7,
    ageMax: 16,
    estimatedMinutes: 7,
    order: 6,
    content: `# Delayed Gratification

Delayed gratification means choosing to wait for something better instead of taking something smaller right now.

## The Marshmallow Test

In a famous experiment, children were offered a choice: eat one marshmallow now, or wait 15 minutes and get two marshmallows.

The children who waited — who could delay their gratification — tended to do better in school, have better health, and be more successful later in life.

## Why It Matters With Money

Every day, you make choices between spending now and saving for later:

- **Spend now:** Buy snacks today → they're gone in 10 minutes
- **Save for later:** Save that money → buy a bicycle in 3 months

The bicycle gives you freedom, independence, and exercise for years. The snacks give you 10 minutes of enjoyment.

## How to Practice

1. **Set a goal** — know what you're saving for and why it matters
2. **Visualize** — imagine how good it will feel when you reach your goal
3. **Track progress** — watch your savings grow, which makes waiting easier
4. **Reward milestones** — celebrate when you're halfway, not just at the end

## The Trap

We live in a world designed to make you spend NOW. Advertisements, sales, and social media all push you to buy immediately. But the things that are truly valuable — education, a home, financial freedom — take time to build.

## Think About It

Every time you choose to save instead of spend, you're investing in your future self. The person you'll be in 5 years is shaped by the choices you make today.`,
    quiz: [
      {
        question: "Delayed gratification means:",
        options: [
          "Never spending money",
          "Choosing to wait for something better instead of taking something smaller now",
          "Waiting for sales before buying",
          "Being patient at the bank",
        ],
        correctIndex: 1,
        explanation: "Delayed gratification is the ability to resist immediate temptation in order to receive a greater reward later.",
      },
      {
        question: "Why is delayed gratification important for building wealth?",
        options: [
          "Because banks reward patience",
          "Because saving for bigger goals leads to more valuable outcomes than spending on small things now",
          "Because spending is always bad",
          "It is not important",
        ],
        correctIndex: 1,
        explanation: "Small purchases add up to nothing lasting. Saving for bigger goals gives you assets that provide value for years.",
      },
      {
        question: "What can help you practice delayed gratification?",
        options: [
          "Setting a clear goal and visualizing the outcome",
          "Avoiding all spending forever",
          "Buying what you want immediately",
          "Asking friends for permission",
        ],
        correctIndex: 0,
        explanation: "Having a clear goal and imagining the reward makes it easier to resist the temptation to spend now.",
      },
    ],
  },
];

// ---- Service ---------------------------------------------------------------

export const EducationService = {
  async seedLessons() {
    for (const lesson of SEED_LESSONS) {
      await db.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          description: lesson.description,
          subject: lesson.subject,
          difficulty: lesson.difficulty,
          ageMin: lesson.ageMin,
          ageMax: lesson.ageMax,
          estimatedMinutes: lesson.estimatedMinutes,
          content: lesson.content,
          quiz: JSON.stringify(lesson.quiz),
          order: lesson.order,
        },
        create: {
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          subject: lesson.subject,
          difficulty: lesson.difficulty,
          ageMin: lesson.ageMin,
          ageMax: lesson.ageMax,
          estimatedMinutes: lesson.estimatedMinutes,
          content: lesson.content,
          quiz: JSON.stringify(lesson.quiz),
          order: lesson.order,
        },
      });
    }
    logger.info(`Seeded ${SEED_LESSONS.length} lessons`);
  },

  async getAllLessons(): Promise<Lesson[]> {
    const rows = await db.lesson.findMany({
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      subject: r.subject,
      difficulty: r.difficulty,
      ageMin: r.ageMin,
      ageMax: r.ageMax,
      estimatedMinutes: r.estimatedMinutes,
      content: r.content,
      quiz: r.quiz ? JSON.parse(r.quiz) : [],
      order: r.order,
    }));
  },

  async getLesson(slug: string): Promise<Lesson | null> {
    const row = await db.lesson.findUnique({ where: { slug } });
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      subject: row.subject,
      difficulty: row.difficulty,
      ageMin: row.ageMin,
      ageMax: row.ageMax,
      estimatedMinutes: row.estimatedMinutes,
      content: row.content,
      quiz: row.quiz ? JSON.parse(row.quiz) : [],
      order: row.order,
    };
  },

  async getLessonsWithProgress(userId: string): Promise<LessonWithProgress[]> {
    const lessons = await this.getAllLessons();
    const progress = await db.lessonProgress.findMany({
      where: { userId },
    });
    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

    return lessons.map((lesson) => {
      const p = progressMap.get(lesson.id);
      return {
        ...lesson,
        status: (p?.status as any) ?? "NOT_STARTED",
        completedAt: p?.completedAt?.getTime(),
      };
    });
  },

  async startLesson(userId: string, lessonId: string) {
    const existing = await db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      if (existing.status === "NOT_STARTED") {
        await db.lessonProgress.update({
          where: { id: existing.id },
          data: { status: "IN_PROGRESS", startedAt: new Date() },
        });
      }
    } else {
      await db.lessonProgress.create({
        data: {
          userId,
          lessonId,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
    if (lesson) {
      await publish({
        type: "LessonStarted",
        userId,
        lessonId,
        lessonTitle: lesson.title,
      });
    }
  },

  async completeLesson(
    userId: string,
    lessonId: string,
    answers: number[],
    timeSpentSec: number,
  ): Promise<{ score: number; passed: boolean }> {
    const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || !lesson.quiz) throw new Error("Lesson not found");

    const quiz = JSON.parse(lesson.quiz) as QuizQuestion[];
    let correct = 0;
    for (let i = 0; i < quiz.length; i++) {
      if (answers[i] === quiz[i].correctIndex) correct++;
    }
    const score = Math.round((correct / quiz.length) * 100);
    const passed = score >= 60;

    // Record quiz attempt
    await db.quizAttempt.create({
      data: {
        userId,
        lessonId,
        answers: JSON.stringify(answers),
        score,
        passed,
      },
    });

    // Update progress
    if (passed) {
      await db.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          status: "COMPLETED",
          completedAt: new Date(),
          timeSpentSec: { increment: timeSpentSec },
        },
        create: {
          userId,
          lessonId,
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
          timeSpentSec,
        },
      });

      await publish({
        type: "LessonCompleted",
        userId,
        lessonId,
        lessonTitle: lesson.title,
        score,
        timeSpentSec,
      });

      // Evaluate achievements
      const childId = await this.getChildIdFromUser(userId);
      if (childId) {
        await AchievementService.evaluate(userId, childId);
      }
    } else {
      await publish({
        type: "QuizFailed",
        userId,
        lessonId,
        score,
      });
    }

    return { score, passed };
  },

  async getChildIdFromUser(userId: string): Promise<string | null> {
    const user = await db.user.findUnique({ where: { id: userId } });
    return user?.childId ?? null;
  },

  async getProgressStats(userId: string) {
    const total = await db.lesson.count();
    const completed = await db.lessonProgress.count({
      where: { userId, status: "COMPLETED" },
    });
    const inProgress = await db.lessonProgress.count({
      where: { userId, status: "IN_PROGRESS" },
    });
    const avgScore = await db.quizAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
    });
    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageScore: avgScore._avg.score ?? 0,
    };
  },
};
