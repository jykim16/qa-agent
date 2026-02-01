import { randomUUID } from "node:crypto";
import { generateTestPlan } from "../services/bedrock-client.js";
import { savePlan } from "../services/storage.js";
import type { TestPlan } from "../types/test-plan.js";

export const generateTestPlanTool = {
  name: "generate_test_plan",
  description: "Generate a test plan from requirements and codebase",
  inputSchema: {
    type: "object" as const,
    properties: {
      requirements: { type: "string", description: "Plain English requirements" },
      repoUrl: { type: "string", description: "GitHub repo or PR URL" },
      baseUrl: { type: "string", description: "URL of running application" },
      name: { type: "string", description: "Test plan name" },
    },
    required: ["requirements", "baseUrl"],
  },
};

function extractProjectName(repoUrl?: string): string {
  if (!repoUrl) return "default";
  const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
  return match?.[1]?.replace(/\.git$/, "") || "default";
}

export async function handleGenerateTestPlan(args: {
  requirements: string;
  repoUrl?: string;
  baseUrl: string;
  name?: string;
}) {
  const steps = await generateTestPlan(args.requirements);
  const projectName = extractProjectName(args.repoUrl);
  const now = new Date().toISOString();

  const plan: Omit<TestPlan, "id"> = {
    name: args.name || `Test Plan ${now.slice(0, 10)}`,
    description: args.requirements.slice(0, 200),
    project: { name: projectName, repoUrl: args.repoUrl },
    prompt: args.requirements,
    baseUrl: args.baseUrl,
    steps,
    createdAt: now,
    updatedAt: now,
  };

  const planId = await savePlan(plan);
  return {
    planId,
    name: plan.name,
    steps: steps.length,
    path: `.qa-agent/plans/${projectName}/${planId}.json`,
  };
}
