import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listTestPlansTool, handleListTestPlans } from "./tools/list-test-plans.js";
import { listTestRunsTool, handleListTestRuns } from "./tools/list-test-runs.js";

const server = new Server(
  { name: "qa-agent", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const tools = [listTestPlansTool, listTestRunsTool];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_test_plans":
      return { content: [{ type: "text", text: JSON.stringify(await handleListTestPlans(args as any)) }] };
    case "list_test_runs":
      return { content: [{ type: "text", text: JSON.stringify(await handleListTestRuns(args as any)) }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("QA Agent MCP server running");
