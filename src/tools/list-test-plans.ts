import { listPlans } from "../services/storage.js";

export const listTestPlansTool = {
  name: "list_test_plans",
  description: "List all available test plans",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Filter by project name" },
    },
  },
};

export async function handleListTestPlans(args: { project?: string }) {
  const plans = await listPlans(args.project);
  return { plans };
}
