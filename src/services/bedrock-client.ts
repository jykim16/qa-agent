import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { TestStep } from "../types/test-plan.js";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0";

export async function generateTestPlan(
  prompt: string,
  context?: string
): Promise<TestStep[]> {
  const systemPrompt = `You are a QA engineer generating test steps. Output valid JSON array of test steps.
Each step must have: id (string), name (string), type (one of: agentic_browsing, selenese, unit_assertion, agentic_assertion).
For agentic_browsing: include instruction (string).
For agentic_assertion: include instruction and criteria (strings).
For unit_assertion: include assertions array with type, selector, expected.
Output ONLY the JSON array, no markdown.`;

  const userPrompt = context
    ? `Context:\n${context}\n\nRequirements:\n${prompt}`
    : prompt;

  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return JSON.parse(result.content[0].text) as TestStep[];
}

export interface AssertionResult {
  passed: boolean;
  reasoning: string;
  confidence: number;
}

export async function evaluateAssertion(
  instruction: string,
  criteria: string,
  pageContent: string
): Promise<AssertionResult> {
  const systemPrompt = `You are a QA judge evaluating if a page meets criteria.
Output JSON: {"passed": boolean, "reasoning": "explanation", "confidence": 0.0-1.0}
Output ONLY valid JSON, no markdown.`;

  const userPrompt = `Instruction: ${instruction}
Criteria: ${criteria}
Page content:
${pageContent.slice(0, 8000)}`;

  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return JSON.parse(result.content[0].text) as AssertionResult;
}
