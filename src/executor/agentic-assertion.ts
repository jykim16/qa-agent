import { evaluateAssertion } from "../services/bedrock-client.js";
import type { AgenticAssertionStep } from "../types/test-plan.js";
import type { StepResult } from "../types/test-run.js";

export async function executeAgenticAssertion(
  step: AgenticAssertionStep,
  previousResults: StepResult[]
): Promise<StepResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  // Extract logs and actual values from previous steps for context
  const contextParts: string[] = [];
  for (const prev of previousResults) {
    contextParts.push(`--- Step: ${prev.stepName} (${prev.stepType}) ---`);
    if (prev.logs?.length) {
      contextParts.push(prev.logs.join("\n"));
    }
    if (prev.actual !== undefined) {
      contextParts.push(`Result: ${JSON.stringify(prev.actual, null, 2)}`);
    }
  }
  const context = contextParts.length > 0 ? contextParts.join("\n\n") : JSON.stringify(previousResults, null, 2);
  const result = await evaluateAssertion(step.instruction, step.criteria, context);

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
