import type { TestStep } from "./test-plan.js";

export interface TestRun {
  id: string;
  planId: string;
  planName: string;
  status: "running" | "passed" | "failed" | "error";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  baseUrl: string;
  stepResults: StepResult[];
  error?: string;
}

export interface StepResult {
  stepId: string;
  stepName: string;
  stepType: TestStep["type"];
  status: "passed" | "failed" | "skipped" | "error";
  startedAt: string;
  completedAt: string;
  duration: number;
  screenshot?: string;
  logs?: string[];
  llmReasoning?: string;
  llmConfidence?: number;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

export interface TestRunSummary {
  id: string;
  planId: string;
  planName: string;
  status: TestRun["status"];
  duration?: number;
  startedAt: string;
}

export interface RunFilters {
  planId?: string;
  status?: TestRun["status"];
}
