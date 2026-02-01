import { getPlan } from "../services/storage.js";
import { runTestPlan } from "../executor/index.js";

export const runTestPlanTool = {
  name: "run_test_plan",
  description: "Execute a test plan against a running application",
  inputSchema: {
    type: "object" as const,
    properties: {
      planId: { type: "string", description: "Test plan ID to execute" },
      baseUrl: { type: "string", description: "Override base URL if different" },
    },
    required: ["planId"],
  },
};

export async function handleRunTestPlan(args: {
  planId: string;
  baseUrl?: string;
}) {
  const plan = await getPlan(args.planId);
  if (!plan) {
    return { error: { code: "PLAN_NOT_FOUND", message: `Plan ${args.planId} not found` } };
  }

  const run = await runTestPlan(plan, args.baseUrl);
  return {
    runId: run.id,
    status: run.status,
    duration: run.duration,
    stepsExecuted: run.stepResults.length,
    stepsPassed: run.stepResults.filter((r) => r.status === "passed").length,
    failedStep: run.stepResults.find((r) => r.status === "failed")?.stepName,
  };
}
