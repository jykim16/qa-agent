import { listRuns } from "../services/storage.js";
import type { TestRun } from "../types/test-run.js";

export const listTestRunsTool = {
  name: "list_test_runs",
  description: "List test run executions",
  inputSchema: {
    type: "object" as const,
    properties: {
      planId: { type: "string", description: "Filter by test plan ID" },
      status: {
        type: "string",
        enum: ["passed", "failed", "running"],
        description: "Filter by status",
      },
    },
  },
};

export async function handleListTestRuns(args: {
  planId?: string;
  status?: TestRun["status"];
}) {
  const runs = await listRuns(args);
  return { runs };
}
