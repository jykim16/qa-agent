import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listTestPlansTool, handleListTestPlans } from "./tools/list-test-plans.js";
import { listTestRunsTool, handleListTestRuns } from "./tools/list-test-runs.js";
import { getTestRunTool, handleGetTestRun } from "./tools/get-test-run.js";
import { generateTestPlanTool, handleGenerateTestPlan } from "./tools/generate-test-plan.js";
import { runTestPlanTool, handleRunTestPlan } from "./tools/run-test-plan.js";
import { debug, info, isDebugEnabled } from "./logger.js";

const server = new Server(
  { name: "qa-agent", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const tools = [
  listTestPlansTool,
  listTestRunsTool,
  getTestRunTool,
  generateTestPlanTool,
  runTestPlanTool,
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  debug("mcp", "ListTools request");
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  debug("mcp", `CallTool request`, { tool: name, args });

  const startTime = Date.now();
  let result: unknown;

  switch (name) {
    case "list_test_plans":
      result = await handleListTestPlans(args as any);
      break;
    case "list_test_runs":
      result = await handleListTestRuns(args as any);
      break;
    case "get_test_run":
      result = await handleGetTestRun(args as any);
      break;
    case "generate_test_plan":
      result = await handleGenerateTestPlan(args as any);
      break;
    case "run_test_plan":
      result = await handleRunTestPlan(args as any);
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  debug("mcp", `CallTool response`, { tool: name, duration: Date.now() - startTime });
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);

info("QA Agent MCP server running");
if (isDebugEnabled()) {
  info("Debug mode enabled (--debug flag or QA_AGENT_DEBUG=true)");
}
