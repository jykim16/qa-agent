import { executeAgenticStep } from "../services/rtrvr-client.js";
import type { AgenticBrowsingStep } from "../types/test-plan.js";
import type { StepResult } from "../types/test-run.js";

export async function executeAgenticBrowsing(
  step: AgenticBrowsingStep,
  baseUrl: string,
  trajectoryId?: string
): Promise<{ result: StepResult; trajectoryId: string }> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  const response = await executeAgenticStep(step.instruction, [baseUrl], trajectoryId);

  const completedAt = new Date().toISOString();
  return {
    result: {
      stepId: step.id,
      stepName: step.name,
      stepType: "agentic_browsing",
      status: response.success ? "passed" : "failed",
      startedAt,
      completedAt,
      duration: Date.now() - start,
      screenshot: response.screenshot,
      error: response.error,
      logs: response.result?.text ? [response.result.text] : undefined,
    },
    trajectoryId: response.trajectoryId,
  };
}
