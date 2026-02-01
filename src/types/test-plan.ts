export interface TestPlan {
  id: string;
  name: string;
  description: string;
  project: {
    name: string;
    repoUrl?: string;
    description?: string;
  };
  prompt: string;
  baseUrl: string;
  steps: TestStep[];
  createdAt: string;
  updatedAt: string;
}

export type TestStep =
  | AgenticBrowsingStep
  | SeleneseStep
  | UnitAssertionStep
  | AgenticAssertionStep;

interface BaseStep {
  id: string;
  name: string;
}

export interface AgenticBrowsingStep extends BaseStep {
  type: "agentic_browsing";
  instruction: string;
  expectedOutcome?: string;
  timeout?: number;
}

export interface SeleneseStep extends BaseStep {
  type: "selenese";
  commands: SeleneseCommand[];
}

export interface SeleneseCommand {
  command:
    | "open"
    | "click"
    | "type"
    | "waitForElement"
    | "assertText"
    | "assertVisible";
  target: string;
  value?: string;
}

export interface UnitAssertionStep extends BaseStep {
  type: "unit_assertion";
  assertions: UnitAssertion[];
}

export interface UnitAssertion {
  type: "equals" | "contains" | "matches" | "exists" | "visible";
  selector?: string;
  property?: string;
  expected: string | boolean | number;
}

export interface AgenticAssertionStep extends BaseStep {
  type: "agentic_assertion";
  instruction: string;
  criteria: string;
  context?: string;
}

export interface TestPlanSummary {
  id: string;
  name: string;
  project: string;
  stepCount: number;
  createdAt: string;
}
