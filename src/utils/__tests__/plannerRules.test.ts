import { runAllPlannerRuleTests } from '../plannerRuleTests';
import { SEED_PROVIDERS, SEED_NGO } from '../../data/surplusLinkData';

/**
 * Unit-style verification runner
 */
export async function executeUnitTests() {
  const results = await runAllPlannerRuleTests(SEED_PROVIDERS, SEED_NGO);
  const allPassed = results.every((r) => r.passed);
  return {
    allPassed,
    results,
  };
}
