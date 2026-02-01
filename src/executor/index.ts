import { saveRun } from "../services/storage.js";
import { scrapePage } from "../services/rtrvr-client.js";
import { executeAgenticBrowsing } from "./agentic-browsing.js";
import { executeAgenticAssertion } from "./agentic-assertion.js";
import { executeUnitAssertion } from "./unit-assertion.js";
import type { TestPlan } from "../types/test-plan.js";
import type { TestRun, StepResult } from "../types/test-run.js";
import { randomUUID } from "node:crypto";
import { debug, error as logError } from "../logger.js";

export async function runTestPlan(
  plan: TestPlan,
  baseUrl?: string
): Promise<{ runId: string }> {
  const effectiveBaseUrl = baseUrl || plan.baseUrl;
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  debug("executor", `Starting test run`, { runId, planId: plan.id, planName: plan.name, baseUrl: effectiveBaseUrl });

  const initialRun: TestRun = {
    id: runId,
    planId: plan.id,
    planName: plan.name,
    status: "running",
    startedAt,
    baseUrl: effectiveBaseUrl,
    stepResults: [],
  };
  await saveRun(initialRun);

  // Execute in background
  executeSteps(runId, plan, effectiveBaseUrl, startedAt);

  return { runId };
}

async function executeSteps(
  runId: string,
  plan: TestPlan,
  baseUrl: string,
  startedAt: string
): Promise<void> {
  const stepResults: StepResult[] = [];
  // TODO: Re-enable trajectoryId once rtrvr.ai API fully supports it
  // let trajectoryId: string | undefined;
  let finalStatus: TestRun["status"] = "passed";
  let runError: string | undefined;

  debug("executor", `Executing ${plan.steps.length} steps for run ${runId}`);

  for (const step of plan.steps) {
    debug("executor", `Starting step`, { runId, stepId: step.id, stepName: step.name, stepType: step.type });
    const stepStartTime = Date.now();

    try {
      let result: StepResult;

      switch (step.type) {
        case "agentic_browsing": {
          debug("executor", `Executing agentic_browsing step`, { instruction: step.instruction });
          // TODO: Re-enable trajectoryId once rtrvr.ai API fully supports it
          // const res = await executeAgenticBrowsing(step, baseUrl, trajectoryId);
          // trajectoryId = res.trajectoryId;
          const res = await executeAgenticBrowsing(step, baseUrl);
          result = res.result;
          break;
        }
        case "agentic_assertion": {
          debug("executor", `Executing agentic_assertion step`, { instruction: step.instruction, criteria: step.criteria });
          result = await executeAgenticAssertion(step, stepResults);
          break;
        }
        case "unit_assertion": {
          debug("executor", `Executing unit_assertion step, scraping ${baseUrl}`);
          const scrape = await scrapePage(baseUrl);
          debug("executor", `Scrape complete`, { success: scrape.success, contentLength: scrape.content?.length });
          result = executeUnitAssertion(step, scrape.content || "", scrape.tree || "");
          break;
        }
        case "selenese": {
          debug("executor", `Skipping selenese step (not implemented)`);
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

      const stepDuration = Date.now() - stepStartTime;
      debug("executor", `Step completed`, { runId, stepId: step.id, status: result.status, duration: stepDuration });

      stepResults.push(result);

      if (result.status === "failed" || result.status === "error") {
        finalStatus = "failed";
        debug("executor", `Step failed, stopping execution`, { runId, stepId: step.id });
        break;
      }
    } catch (err) {
      finalStatus = "error";
      runError = err instanceof Error ? err.message : String(err);
      logError(`Step ${step.id} threw exception`, err);
      debug("executor", `Step threw exception`, { runId, stepId: step.id, error: runError });
      break;
    }
  }

  const completedAt = new Date().toISOString();
  const totalDuration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  debug("executor", `Test run completed`, { runId, status: finalStatus, duration: totalDuration, stepsCompleted: stepResults.length });

  await saveRun({
    id: runId,
    planId: plan.id,
    planName: plan.name,
    status: finalStatus,
    startedAt,
    completedAt,
    duration: totalDuration,
    baseUrl,
    stepResults,
    error: runError,
  });
}
