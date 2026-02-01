import { scrapePage } from "../services/rtrvr-client.js";
import { evaluateAssertion } from "../services/bedrock-client.js";
import type { AgenticAssertionStep } from "../types/test-plan.js";
import type { StepResult } from "../types/test-run.js";

export async function executeAgenticAssertion(
  step: AgenticAssertionStep,
  pageUrl: string
): Promise<StepResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  const scrape = await scrapePage(pageUrl);
  if (!scrape.success || !scrape.content) {
    return {
      stepId: step.id,
      stepName: step.name,
      stepType: "agentic_assertion",
      status: "error",
      startedAt,
      completedAt: new Date().toISOString(),
      duration: Date.now() - start,
      error: scrape.error || "Failed to scrape page",
    };
  }

  const result = await evaluateAssertion(step.instruction, step.criteria, scrape.content);

  return {
    stepId: step.id,
    stepName: step.name,
    stepType: "agentic_assertion",
    status: result.passed ? "passed" : "failed",
    startedAt,
    completedAt: new Date().toISOString(),
    duration: Date.now() - start,
    llmReasoning: result.reasoning,
    llmConfidence: result.confidence,
  };
}
