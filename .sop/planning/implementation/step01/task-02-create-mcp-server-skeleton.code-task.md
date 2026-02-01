# Task: Create MCP Server Skeleton

## Description
Implement the basic MCP server entry point that starts, connects via stdio transport, and responds to tool listing requests with an empty tools array.

## Background
The MCP server is the core interface through which AI assistants will interact with the QA Agent. This skeleton establishes the server infrastructure that all tools will be registered to in subsequent steps.

## Reference Documentation
**Required:**
- Design: .sop/planning/design/detailed-design.md

**Additional References:**
- .sop/planning/research/mcp-server.md (MCP SDK patterns and examples)

**Note:** Read the detailed design document before implementation. The mcp-server.md research contains the exact SDK patterns to follow.

## Technical Requirements
1. Create `src/index.ts` as the server entry point
2. Initialize MCP Server with name "qa-agent" and version "1.0.0"
3. Enable tools capability in server configuration
4. Register ListToolsRequestSchema handler returning empty tools array
5. Connect server to StdioServerTransport
6. Handle graceful startup and connection

## Dependencies
- Task 1 completed (project initialized with dependencies)
- @modelcontextprotocol/sdk package

## Implementation Approach
1. Import Server, StdioServerTransport, and ListToolsRequestSchema from MCP SDK
2. Create server instance with name/version and tools capability
3. Set request handler for ListToolsRequestSchema returning `{ tools: [] }`
4. Create stdio transport and connect server
5. Add console.error logging for startup confirmation (stderr so it doesn't interfere with stdio)

## Acceptance Criteria

1. **Server Starts Successfully**
   - Given the project is built with `npm run build`
   - When `node build/index.js` is executed
   - Then the server starts without errors

2. **Empty Tools Response**
   - Given the server is running
   - When an MCP host sends a ListTools request
   - Then the server responds with an empty tools array

3. **Stdio Transport**
   - Given the server is running
   - When connected via stdio (stdin/stdout)
   - Then MCP protocol messages are exchanged correctly

## Metadata
- **Complexity**: Low
- **Labels**: MCP, Server, TypeScript, Infrastructure
- **Required Skills**: TypeScript, MCP SDK, async/await
