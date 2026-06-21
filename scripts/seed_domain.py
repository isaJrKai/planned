"""Seed achievements + lessons into the database."""
import subprocess, sys

# Run the TypeScript seed via bun
result = subprocess.run(
    ["bun", "run", "-e", """
const { AchievementService } = require('./src/server/services/achievement.service.ts');
const { EducationService } = require('./src/server/services/education.service.ts');

async function main() {
  await AchievementService.seedAchievements();
  await EducationService.seedLessons();
  console.log('Done seeding achievements + lessons');
}

main().catch(console.error);
"""],
    capture_output=True,
    text=True,
    cwd="/home/z/my-project",
)
print(result.stdout)
print(result.stderr)
