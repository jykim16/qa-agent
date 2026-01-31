# rtrvr.ai API Research

## Overview

rtrvr.ai provides two main APIs for browser automation:
- **Agent API** (`/agent`) - Full planner + tools engine with multi-step reasoning
- **Scrape API** (`/scrape`) - Low-level raw page data extraction

## Agent API (`POST https://api.rtrvr.ai/agent`)

### Purpose
Primary entry point for agentic web browsing. Sends one JSON payload that can browse the web, load tabular data, call tools, and return structured results.

### Key Features
- Multi-step reasoning with automatic tool orchestration
- Browser control and navigation
- Structured JSON output via schema definition
- File inputs (PDFs, images, documents)
- Tabular data inputs (CSV, JSON, XLSX, Parquet)

### Authentication
```
Authorization: Bearer rtrvr_your_api_key
```

### Core Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | string (required) | Natural-language task description |
| `urls` | string[] | URLs to open in browser tabs |
| `schema` | Schema | JSON Schema for structured output |
| `trajectoryId` | string | Stable ID for workflow continuations |
| `files` | ApiExecuteRequestFile[] | File attachments (PDFs, images) |
| `dataInputs` | ApiTabularInput[] | Tabular data as in-memory sheets |
| `response.verbosity` | "final" \| "steps" \| "debug" | Output detail level |

### Example Request
```bash
curl -X POST https://api.rtrvr.ai/agent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Click the login button and verify the form appears",
    "urls": ["https://example.com"],
    "schema": {
      "type": "object",
      "properties": {
        "success": { "type": "boolean" },
        "formVisible": { "type": "boolean" }
      }
    }
  }'
```

### Response Structure
```typescript
interface AgentApiResponse {
  success: boolean;
  status: 'success' | 'error' | 'cancelled' | 'requires_input' | 'executing';
  trajectoryId: string;
  phase: number;
  output: ApiOutputBlock[];
  result?: {
    text?: string;
    json?: any;
  };
  steps?: ApiStepSummary[];  // When verbosity !== 'final'
  usage: {
    creditsUsed: number;
    creditsLeft?: number;
  };
  metadata: {
    taskRef: string;
    toolsUsed: string[];
  };
}
```

## Scrape API (`POST https://api.rtrvr.ai/scrape`)

### Purpose
Low-level endpoint for raw page text and accessibility trees. No planner, no tools—just data for your own models.

### Key Features
- Infra-only credits (cheaper than Agent API)
- Returns extracted text + accessibility tree
- Element link records for navigation
- Ideal for feeding your own LLM/RAG stack

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `urls` | string[] (required) | URLs to scrape |
| `trajectoryId` | string | Optional grouping ID |
| `settings` | Partial<UserSettings> | Per-request overrides |
| `response.inlineOutputMaxBytes` | number | Max response size (default 1MB) |

### Example Request
```bash
curl -X POST https://api.rtrvr.ai/scrape \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com"],
    "response": { "inlineOutputMaxBytes": 1048576 }
  }'
```

### Response Structure
```typescript
interface ScrapeApiResponse {
  success: boolean;
  status: "success" | "error";
  trajectoryId: string;
  tabs?: ScrapedTab[];
  usageData: ScrapeUsageData;
}

interface ScrapedTab {
  tabId: number;
  url: string;
  title: string;
  content?: string;           // Extracted visible text
  tree?: string;              // JSON accessibility tree
  elementLinkRecord?: Record<number, string>;  // Element ID -> href
}
```

## Agent vs Scrape Comparison

| Dimension | /agent | /scrape |
|-----------|--------|---------|
| What it does | Full agent run with planner + tools | Raw page text + accessibility tree |
| Latency | Higher (LLM calls + multi-step) | Lower (browser + proxy only) |
| Credits | Infra + model/tool credits | Infra-only credits |
| Best for | End-to-end automations | Feeding your own LLM/RAG |

## Implications for QA Agent Design

### For Agentic Browsing Steps
- Use Agent API with natural language instructions
- Define JSON schema for structured assertion results
- Leverage `trajectoryId` for multi-step test sequences

### For Selenese/Scripted Steps
- Could use Scrape API to get page state
- Parse accessibility tree for element verification
- Use `elementLinkRecord` for link validation

### For AI Assertions
- Agent API can return structured results matching a schema
- Can ask agent to evaluate conditions and return boolean/reasoning

## References
- Agent API Docs: https://www.rtrvr.ai/docs/agent
- Scrape API Docs: https://www.rtrvr.ai/docs/scrape
