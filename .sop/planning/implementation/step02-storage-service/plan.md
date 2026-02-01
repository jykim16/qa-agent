# Step 2: Storage Service - Plan

## Test Scenarios

### Types Validation
1. TestPlan type accepts valid plan structure
2. TestStep union correctly discriminates step types
3. TestRun type accepts valid run structure

### Storage Service - Plans
1. savePlan() creates file in correct directory structure
2. savePlan() generates UUID if id not provided
3. getPlan() returns plan when exists
4. getPlan() returns null when not found
5. listPlans() returns empty array when no plans
6. listPlans() returns all plans across projects
7. listPlans() filters by project when specified

### Storage Service - Runs
1. saveRun() creates file in runs directory
2. getRun() returns run when exists
3. getRun() returns null when not found
4. listRuns() returns empty array when no runs
5. listRuns() filters by planId when specified
6. listRuns() filters by status when specified

## Implementation Tasks

### Task 1: Create Type Definitions
- `src/types/test-plan.ts`: TestPlan, TestStep union, all step types
- `src/types/test-run.ts`: TestRun, StepResult, related types

### Task 2: Create Storage Service
- `src/services/storage.ts`: All CRUD operations for plans and runs
- Directory structure: `.qa-agent/plans/{project}/`, `.qa-agent/runs/`

## Acceptance Criteria
1. Types compile without errors
2. Storage service can save and retrieve plans
3. Storage service can save and retrieve runs
4. Plans organized by project directory
5. Build succeeds with `npm run build`
