import { saveRun } from "../services/storage.js";
import { scrapePage } from "../services/rtrvr-client.js";
import { executeAgenticBrowsing } from "./agentic-browsing.js";
import { executeAgenticAssertion } from "./agentic-assertion.js";
import { executeUnitAssertion } from "./unit-assertion.js";
import type { TestPlan } from "../types/test-plan.js";
import type { TestRun, StepResult } from "../types/test-run.js";

export async function runTestPlan(
  plan: TestPlan,
  baseUrl?: string
): Promise<TestRun> {
  const effectiveBaseUrl = baseUrl || plan.baseUrl;
  const startedAt = new Date().toISOString();
  const stepResults: StepResult[] = [];
  let trajectoryId: string | undefined;
  let finalStatus: TestRun["status"] = "passed";
  let runError: string | undefined;

  for (const step of plan.steps) {
    try {
      let result: StepResult;

      switch (step.type) {
        case "agentic_browsing": {
          const res = await executeAgenticBrowsing(step, effectiveBaseUrl, trajectoryId);
          result = res.result;
          trajectoryId = res.trajectoryId;
          break;
        }
        case "agentic_assertion": {
          result = await executeAgenticAssertion(step, effectiveBaseUrl);
          break;
        }
        case "unit_assertion": {
          const scrape = await scrapePage(effectiveBaseUrl);
          result = executeUnitAssertion(step, scrape.content || "", scrape.tree || "");
          break;
        }
        case "selenese": {
          // Selenese not implemented yet - skip
          result = {
            stepId: step.id,
            stepName: step.name,
            stepType: "selenese",
            status: "skipped",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            duration: 0,
            logs: ["Selenese execution not implemented"],
          };
          break;
        }
        default:
          throw new Error(`Unknown step type`);
      }

      stepResults.push(result);

      if (result.status === "failed" || result.status === "error") {
        finalStatus = "failed";
        break; // Stop on first failure
      }
    } catch (err) {
      finalStatus = "error";
      runError = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  const completedAt = new Date().toISOString();
  const run: Omit<TestRun, "id"> = {
    planId: plan.id,
    planName: plan.name,
    status: finalStatus,
    startedAt,
    completedAt,
    duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
    baseUrl: effectiveBaseUrl,
    stepResults,
    error: runError,
  };

  const runId = await saveRun(run);
  return { ...run, id: runId };
}
