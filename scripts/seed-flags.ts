// Seed feature flags
import { FeatureFlagService } from "../src/server/services/feature-flag.service";

async function main() {
  await FeatureFlagService.seedDefaults();
  console.log("✅ Feature flags seeded");
}

main().catch(console.error);
