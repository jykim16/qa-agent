import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { TestPlan, TestPlanSummary } from "../types/test-plan.js";
import type { TestRun, TestRunSummary, RunFilters } from "../types/test-run.js";

const BASE_DIR = ".qa-agent";
const PLANS_DIR = join(BASE_DIR, "plans");
const RUNS_DIR = join(BASE_DIR, "runs");

export async function savePlan(plan: Omit<TestPlan, "id"> & { id?: string }): Promise<string> {
  const id = plan.id ?? randomUUID();
  const fullPlan: TestPlan = { ...plan, id };
  const projectDir = join(PLANS_DIR, fullPlan.project.name);
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, `${id}.json`), JSON.stringify(fullPlan, null, 2));
  return id;
}

export async function getPlan(planId: string): Promise<TestPlan | null> {
  try {
    const projects = await readdir(PLANS_DIR).catch(() => []);
    for (const project of projects) {
      const filePath = join(PLANS_DIR, project, `${planId}.json`);
      try {
        const data = await readFile(filePath, "utf-8");
        return JSON.parse(data) as TestPlan;
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function listPlans(project?: string): Promise<TestPlanSummary[]> {
  const summaries: TestPlanSummary[] = [];
  try {
    const projects = project ? [project] : await readdir(PLANS_DIR).catch(() => []);
    for (const proj of projects) {
      const projectDir = join(PLANS_DIR, proj);
      const files = await readdir(projectDir).catch(() => []);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await readFile(join(projectDir, file), "utf-8");
          const plan = JSON.parse(data) as TestPlan;
          summaries.push({
            id: plan.id,
            name: plan.name,
            project: plan.project.name,
            stepCount: plan.steps.length,
            createdAt: plan.createdAt,
          });
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Return empty array if directory doesn't exist
  }
  return summaries;
}

export async function saveRun(run: Omit<TestRun, "id"> & { id?: string }): Promise<string> {
  const id = run.id ?? randomUUID();
  const fullRun: TestRun = { ...run, id };
  await mkdir(RUNS_DIR, { recursive: true });
  await writeFile(join(RUNS_DIR, `${id}.json`), JSON.stringify(fullRun, null, 2));
  return id;
}

export async function getRun(runId: string): Promise<TestRun | null> {
  try {
    const data = await readFile(join(RUNS_DIR, `${runId}.json`), "utf-8");
    return JSON.parse(data) as TestRun;
  } catch {
    return null;
  }
}

export async function listRuns(filters?: RunFilters): Promise<TestRunSummary[]> {
  const summaries: TestRunSummary[] = [];
  try {
    const files = await readdir(RUNS_DIR).catch(() => []);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = await readFile(join(RUNS_DIR, file), "utf-8");
        const run = JSON.parse(data) as TestRun;
        if (filters?.planId && run.planId !== filters.planId) continue;
        if (filters?.status && run.status !== filters.status) continue;
        summaries.push({
          id: run.id,
          planId: run.planId,
          planName: run.planName,
          status: run.status,
          duration: run.duration,
          startedAt: run.startedAt,
        });
      } catch {
        continue;
      }
    }
  } catch {
    // Return empty array if directory doesn't exist
  }
  return summaries;
}
