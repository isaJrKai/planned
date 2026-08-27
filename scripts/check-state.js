/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  try {
    const ss = await db.systemSettings.findUnique({ where: { id: "singleton" } });
    console.log("SystemSettings:", JSON.stringify(ss, null, 2));
    const users = await db.user.findMany({ select: { id: true, email: true, role: true, familyRole: true, deletedAt: true, twoFactorEnabled: true } });
    console.log("Users:", JSON.stringify(users, null, 2));
    const rl = await db.rateLimitEntry.findMany();
    console.log("RateLimit entries:", JSON.stringify(rl, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await db.$disconnect();
  }
})();
