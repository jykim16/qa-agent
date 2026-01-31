# MCP Server Implementation Research

## Overview

Model Context Protocol (MCP) is an open standard introduced by Anthropic in November 2024 to standardize how AI systems integrate with external tools and data sources. It provides a universal interface for reading files, executing functions, and handling contextual prompts.

## Key Concepts

### Architecture Components
- **MCP Servers**: Bridges to APIs, databases, or code. Expose tools to hosts.
- **MCP Clients**: Use the protocol to interact with MCP servers.
- **MCP Hosts**: Manage communication between servers and clients (e.g., Claude Desktop, IDE extensions).

### Communication
- Uses JSON-RPC for communication
- Supports stdio transport (standard input/output)
- Language-agnostic (TypeScript, Python, Go, etc.)

## TypeScript Implementation

### Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "typescript": "^5.3.3"
  }
}
```

### Basic Server Setup
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "my-mcp-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "my_tool",
        description: "Description of what the tool does",
        inputSchema: {
          type: "object",
          properties: {
            param1: { type: "string", description: "First parameter" },
            param2: { type: "number", description: "Second parameter" }
          },
          required: ["param1"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "my_tool") {
    // Execute tool logic
    const result = await executeMyTool(args);
    return { toolResult: result };
  }
  
  throw new McpError(ErrorCode.ToolNotFound, "Tool not found");
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Schema Definition
Tools are defined with JSON Schema for input validation:

```typescript
{
  name: "tool_name",
  description: "Human-readable description",
  inputSchema: {
    type: "object",
    properties: {
      // Define parameters
    },
    required: ["required_param_names"]
  }
}
```

### Error Handling
```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Available error codes
ErrorCode.ToolNotFound
ErrorCode.InvalidParams
ErrorCode.InternalError
```

## Project Structure for QA Agent MCP Server

```
qa-agent/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── generate-test-plan.ts
│   │   ├── run-test-plan.ts
│   │   ├── list-test-plans.ts
│   │   ├── list-test-runs.ts
│   │   └── get-test-run.ts
│   ├── services/
│   │   ├── rtrvr-client.ts   # rtrvr.ai API client
│   │   ├── bedrock-client.ts # Amazon Bedrock client
│   │   └── storage.ts        # JSON file storage
│   └── types/
│       ├── test-plan.ts
│       └── test-run.ts
├── package.json
├── tsconfig.json
└── .qa-agent/                # Data directory
    ├── plans/
    └── runs/
```

## Tool Definitions for QA Agent

### generate_test_plan
```typescript
{
  name: "generate_test_plan",
  description: "Generate a test plan from requirements and codebase",
  inputSchema: {
    type: "object",
    properties: {
      requirements: { type: "string", description: "Plain English requirements" },
      repoUrl: { type: "string", description: "GitHub repo or PR URL" },
      baseUrl: { type: "string", description: "URL of running application" },
      name: { type: "string", description: "Test plan name" }
    },
    required: ["requirements", "baseUrl"]
  }
}
```

### run_test_plan
```typescript
{
  name: "run_test_plan",
  description: "Execute a test plan against a running application",
  inputSchema: {
    type: "object",
    properties: {
      planId: { type: "string", description: "Test plan ID to execute" },
      baseUrl: { type: "string", description: "Override base URL if different" }
    },
    required: ["planId"]
  }
}
```

### list_test_plans
```typescript
{
  name: "list_test_plans",
  description: "List all available test plans",
  inputSchema: {
    type: "object",
    properties: {
      project: { type: "string", description: "Filter by project name" }
    }
  }
}
```

### list_test_runs
```typescript
{
  name: "list_test_runs",
  description: "List test run executions",
  inputSchema: {
    type: "object",
    properties: {
      planId: { type: "string", description: "Filter by test plan ID" },
      status: { type: "string", enum: ["passed", "failed", "running"] }
    }
  }
}
```

### get_test_run
```typescript
{
  name: "get_test_run",
  description: "Get details of a specific test run",
  inputSchema: {
    type: "object",
    properties: {
      runId: { type: "string", description: "Test run ID" }
    },
    required: ["runId"]
  }
}
```

## References
- MCP Specification: https://modelcontextprotocol.io
- TypeScript SDK: @modelcontextprotocol/sdk
- Tutorial: https://hackteam.io/blog/build-your-first-mcp-server-with-typescript-in-under-10-minutes/
