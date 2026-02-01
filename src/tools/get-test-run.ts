import { getRun } from "../services/storage.js";

export const getTestRunTool = {
  name: "get_test_run",
  description: "Get details of a specific test run",
  inputSchema: {
    type: "object" as const,
    properties: {
      runId: { type: "string", description: "Test run ID" },
    },
    required: ["runId"],
  },
};

export async function handleGetTestRun(args: { runId: string }) {
  const run = await getRun(args.runId);
  if (!run) {
    return { error: { code: "RUN_NOT_FOUND", message: `Run ${args.runId} not found` } };
  }
  return run;
}
