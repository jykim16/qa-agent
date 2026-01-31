# QA Agent - Implementation Plan

## Checklist

- [ ] Step 1: Project setup and MCP server skeleton
- [ ] Step 2: Storage service and data types
- [ ] Step 3: list_test_plans and list_test_runs tools
- [ ] Step 4: get_test_run tool
- [ ] Step 5: Bedrock client for LLM interactions
- [ ] Step 6: generate_test_plan tool
- [ ] Step 7: rtrvr.ai client
- [ ] Step 8: Agentic browsing step executor
- [ ] Step 9: Agentic assertion step executor
- [ ] Step 10: Unit assertion step executor
- [ ] Step 11: Test runner orchestration
- [ ] Step 12: run_test_plan tool

---

## Step 1: Project setup and MCP server skeleton

**Objective:** Initialize the TypeScript project with MCP SDK and create a working server that responds to tool listing.

**Implementation guidance:**
- Initialize npm project with TypeScript configuration
- Install dependencies: `@modelcontextprotocol/sdk`, `@aws-sdk/client-bedrock-runtime`
- Create `src/index.ts` with basic MCP server setup
- Register empty tool list handler
- Configure `tsconfig.json` for ES modules

**Test requirements:**
- Server starts without errors
- `ListToolsRequestSchema` handler returns empty tools array

**Integration:** This is the foundation all other steps build upon.

**Demo:** Run `npm run build && node build/index.js` - server starts and can be connected to an MCP host showing 0 tools available.

---

## Step 2: Storage service and data types

**Objective:** Implement file-based storage for test plans and runs with TypeScript types.

**Implementation guidance:**
- Create `src/types/test-plan.ts` with TestPlan, TestStep union types
- Create `src/types/test-run.ts` with TestRun, StepResult types
- Create `src/services/storage.ts` with:
  - `savePlan()`, `getPlan()`, `listPlans()`
  - `saveRun()`, `getRun()`, `listRuns()`
- Use `.qa-agent/plans/{project}/` and `.qa-agent/runs/` directory structure
- Generate IDs with `crypto.randomUUID()`

**Test requirements:**
- Can save and retrieve a test plan
- Can save and retrieve a test run
- Plans organized by project directory

**Integration:** Storage service will be used by all tools.

**Demo:** Write a simple script that creates a plan, saves it, lists plans, and retrieves it - all operations succeed.

---

## Step 3: list_test_plans and list_test_runs tools

**Objective:** Implement the query tools for listing plans and runs.

**Implementation guidance:**
- Create `src/tools/list-test-plans.ts` with tool definition and handler
- Create `src/tools/list-test-runs.ts` with tool definition and handler
- Register tools in MCP server
- Use Storage service for data retrieval
- Support optional filtering (project, planId, status)

**Test requirements:**
- Tools appear in ListTools response
- Returns empty array when no data exists
- Filtering works correctly

**Integration:** Uses Storage service from Step 2.

**Demo:** Connect to MCP host, call `list_test_plans` - returns empty array. Manually create a plan JSON file, call again - returns the plan summary.

---

## Step 4: get_test_run tool

**Objective:** Implement tool to retrieve full test run details.

**Implementation guidance:**
- Create `src/tools/get-test-run.ts` with tool definition and handler
- Return full TestRun object including all step results
- Return appropriate error if run not found

**Test requirements:**
- Returns full run details when found
- Returns error for non-existent run ID

**Integration:** Uses Storage service from Step 2.

**Demo:** Create a test run JSON manually, call `get_test_run` with its ID - returns full run details with step results.

---

## Step 5: Bedrock client for LLM interactions

**Objective:** Create client for Amazon Bedrock to generate test plans and evaluate assertions.

**Implementation guidance:**
- Create `src/services/bedrock-client.ts`
- Use `@aws-sdk/client-bedrock-runtime` with `InvokeModelCommand`
- Implement `generateTestPlan(prompt, context)` - returns TestStep[]
- Implement `evaluateAssertion(instruction, criteria, pageContent)` - returns pass/fail with reasoning
- Design prompts that output structured JSON matching our step types
- Handle AWS credentials via environment/default chain

**Test requirements:**
- Can invoke Bedrock and parse response
- Generated steps match TestStep schema
- Assertion evaluation returns boolean + reasoning

**Integration:** Will be used by generate_test_plan and agentic assertion executor.

**Demo:** Call `generateTestPlan` with sample requirements - returns array of valid TestStep objects. Call `evaluateAssertion` with sample criteria - returns pass/fail judgment.

---

## Step 6: generate_test_plan tool

**Objective:** Implement the tool that generates test plans from requirements.

**Implementation guidance:**
- Create `src/tools/generate-test-plan.ts`
- Accept requirements (required), repoUrl, baseUrl (required), name
- Infer project name from repoUrl (parse GitHub URL) or use "default"
- Call BedrockClient.generateTestPlan() with requirements
- Construct TestPlan object with generated steps
- Save via Storage service
- Return planId, name, step count, file path

**Test requirements:**
- Creates valid test plan from requirements
- Saves plan to correct project directory
- Returns plan summary

**Integration:** Uses Bedrock client (Step 5) and Storage (Step 2).

**Demo:** Call `generate_test_plan` with "Test that the homepage loads and shows a welcome message" - returns planId, plan saved to `.qa-agent/plans/`, viewable as JSON.

---

## Step 7: rtrvr.ai client

**Objective:** Create client for rtrvr.ai Agent and Scrape APIs.

**Implementation guidance:**
- Create `src/services/rtrvr-client.ts`
- Implement `executeAgenticStep(instruction, urls, trajectoryId?)`:
  - POST to `https://api.rtrvr.ai/agent`
  - Pass instruction as `input`, urls array, optional schema
  - Return result, screenshot (if available), trajectoryId
- Implement `scrapePage(url)`:
  - POST to `https://api.rtrvr.ai/scrape`
  - Return page content and accessibility tree
- Handle API key via environment variable `RTRVR_API_KEY`

**Test requirements:**
- Can call Agent API and get response
- Can call Scrape API and get page content
- Handles errors gracefully

**Integration:** Will be used by step executors.

**Demo:** Call `executeAgenticStep` with "Click the first link" against a test URL - returns success/failure and trajectoryId.

---

## Step 8: Agentic browsing step executor

**Objective:** Implement executor for agentic_browsing steps.

**Implementation guidance:**
- Create `src/executor/agentic-browsing.ts`
- Accept AgenticBrowsingStep and execution context (baseUrl, trajectoryId)
- Call RtrvrClient.executeAgenticStep() with step instruction
- Capture screenshot from response
- Return StepResult with status, duration, screenshot, logs

**Test requirements:**
- Executes instruction via rtrvr.ai
- Captures timing and screenshot
- Returns proper StepResult

**Integration:** Uses rtrvr.ai client (Step 7).

**Demo:** Execute an agentic browsing step against a live page - step completes, screenshot captured, result returned.

---

## Step 9: Agentic assertion step executor

**Objective:** Implement executor for agentic_assertion steps (LLM-as-judge).

**Implementation guidance:**
- Create `src/executor/agentic-assertion.ts`
- Accept AgenticAssertionStep and page content
- Call RtrvrClient.scrapePage() to get current page state
- Call BedrockClient.evaluateAssertion() with instruction, criteria, page content
- Return StepResult with pass/fail, LLM reasoning, confidence

**Test requirements:**
- Gets page content and evaluates with LLM
- Returns reasoning and confidence score
- Correctly determines pass/fail

**Integration:** Uses rtrvr.ai client (Step 7) and Bedrock client (Step 5).

**Demo:** Execute an agentic assertion "Verify the page shows a welcome message" against a page - returns pass/fail with LLM reasoning.

---

## Step 10: Unit assertion step executor

**Objective:** Implement executor for unit_assertion steps (deterministic checks).

**Implementation guidance:**
- Create `src/executor/unit-assertion.ts`
- Accept UnitAssertionStep and page content (from scrape)
- For each assertion, evaluate against page content/accessibility tree:
  - `exists`: Check if selector exists in tree
  - `visible`: Check visibility
  - `equals`/`contains`/`matches`: Check text content
- Return StepResult with expected vs actual values

**Test requirements:**
- Evaluates all assertion types correctly
- Reports expected vs actual on failure
- Passes when all assertions pass

**Integration:** Uses scraped page data from rtrvr.ai client.

**Demo:** Execute unit assertions against a page - correctly identifies pass/fail for element existence and text content.

---

## Step 11: Test runner orchestration

**Objective:** Create the orchestrator that runs all steps in sequence.

**Implementation guidance:**
- Create `src/executor/index.ts`
- Accept TestPlan and baseUrl
- Create TestRun record with 'running' status
- Iterate through steps sequentially:
  - Dispatch to appropriate executor based on step type
  - Record StepResult
  - Stop immediately on first failure
- Update TestRun with final status and duration
- Save TestRun via Storage

**Test requirements:**
- Executes steps in order
- Stops on first failure
- Records all results correctly

**Integration:** Uses all step executors (Steps 8-10) and Storage (Step 2).

**Demo:** Run a multi-step test plan - steps execute in sequence, run stops on failure, full results saved to `.qa-agent/runs/`.

---

## Step 12: run_test_plan tool

**Objective:** Implement the MCP tool that triggers test plan execution.

**Implementation guidance:**
- Create `src/tools/run-test-plan.ts`
- Accept planId (required), optional baseUrl override
- Load plan via Storage
- Call test runner orchestrator
- Return run summary (runId, status, duration, steps executed/passed)

**Test requirements:**
- Loads plan and executes it
- Returns accurate summary
- Handles plan not found error

**Integration:** Uses Storage (Step 2) and test runner (Step 11).

**Demo:** Call `run_test_plan` with a valid planId - test executes against target app, returns pass/fail status, full results available via `get_test_run`.

---

## Summary

This plan builds the QA Agent incrementally:

1. **Foundation (Steps 1-4):** Project setup, storage, query tools
2. **Generation (Steps 5-6):** Bedrock integration, test plan generation
3. **Execution (Steps 7-11):** rtrvr.ai integration, step executors, orchestration
4. **Completion (Step 12):** Wire everything together with run_test_plan

Each step produces working, demoable functionality that builds toward the complete system.
