import type { UnitAssertionStep, UnitAssertion } from "../types/test-plan.js";
import type { StepResult } from "../types/test-run.js";

function evaluateSingleAssertion(
  assertion: UnitAssertion,
  content: string,
  tree: string
): { passed: boolean; actual: unknown } {
  const searchText = content + tree;

  switch (assertion.type) {
    case "exists":
    case "visible":
      const exists = assertion.selector
        ? searchText.includes(assertion.selector)
        : false;
      return { passed: exists === assertion.expected, actual: exists };

    case "contains":
      const contains = searchText.includes(String(assertion.expected));
      return { passed: contains, actual: contains };

    case "equals":
      const equals = searchText.includes(String(assertion.expected));
      return { passed: equals, actual: `contains: ${equals}` };

    case "matches":
      const regex = new RegExp(String(assertion.expected));
      const matches = regex.test(searchText);
      return { passed: matches, actual: matches };

    default:
      return { passed: false, actual: "unknown assertion type" };
  }
}

export function executeUnitAssertion(
  step: UnitAssertionStep,
  content: string,
  tree: string
): StepResult {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  const results = step.assertions.map((a) => ({
    assertion: a,
    ...evaluateSingleAssertion(a, content, tree),
  }));

  const allPassed = results.every((r) => r.passed);
  const failed = results.find((r) => !r.passed);

  return {
    stepId: step.id,
    stepName: step.name,
    stepType: "unit_assertion",
    status: allPassed ? "passed" : "failed",
    startedAt,
    completedAt: new Date().toISOString(),
    duration: Date.now() - start,
    expected: failed?.assertion.expected,
    actual: failed?.actual,
    logs: results.map((r) => `${r.assertion.type}: ${r.passed ? "PASS" : "FAIL"}`),
  };
}
