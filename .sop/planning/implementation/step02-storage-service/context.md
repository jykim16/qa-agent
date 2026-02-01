# Step 2: Storage Service - Context

## Task Overview
Implement file-based storage for test plans and runs with TypeScript types.

## Requirements
From plan.md:
- Create `src/types/test-plan.ts` with TestPlan, TestStep union types
- Create `src/types/test-run.ts` with TestRun, StepResult types
- Create `src/services/storage.ts` with save/get/list operations for plans and runs
- Use `.qa-agent/plans/{project}/` and `.qa-agent/runs/` directory structure
- Generate IDs with `crypto.randomUUID()`

## Existing Patterns
- Project uses ES modules (`"type": "module"`)
- TypeScript with strict mode, NodeNext module resolution
- Output to `build/` directory
- MCP SDK patterns from `src/index.ts`

## Data Models (from detailed-design.md)
See `.sop/planning/design/detailed-design.md` for complete type definitions.

## Implementation Paths
- `src/types/test-plan.ts` - TestPlan and TestStep types
- `src/types/test-run.ts` - TestRun and StepResult types  
- `src/services/storage.ts` - File-based storage service
