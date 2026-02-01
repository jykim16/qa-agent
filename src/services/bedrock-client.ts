import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { TestStep } from "../types/test-plan.js";
import { debug } from "../logger.js";
import { TEST_PLAN_GENERATION, ASSERTION_EVALUATION } from "../prompts/index.js";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0";

export async function generateTestPlan(
  prompt: string,
  context?: string
): Promise<TestStep[]> {
  const userPrompt = context
    ? `Context:\n${context}\n\nRequirements:\n${prompt}`
    : prompt;

  debug("bedrock", `generateTestPlan request model=${MODEL_ID}`, { userPrompt: userPrompt.slice(0, 500) });

  const startTime = Date.now();
  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [{ role: "user", content: userPrompt }],
        system: TEST_PLAN_GENERATION,
      }),
    })
  );

  const duration = Date.now() - startTime;
  const result = JSON.parse(new TextDecoder().decode(response.body));
  const parsed = JSON.parse(result.content[0].text) as TestStep[];
  debug("bedrock", `generateTestPlan response duration=${duration}ms`, { raw: result, parsed });
  return parsed;
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
  const userPrompt = `Instruction: ${instruction}
Criteria: ${criteria}
Page content:
${pageContent.slice(0, 8000)}`;

  debug("bedrock", `evaluateAssertion request model=${MODEL_ID}`, { instruction, criteria, contentLength: pageContent.length, contentPreview: pageContent.slice(0, 500) });

  const startTime = Date.now();
  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
        system: ASSERTION_EVALUATION,
      }),
    })
  );

  const duration = Date.now() - startTime;
  const result = JSON.parse(new TextDecoder().decode(response.body));
  const text = result.content[0].text;
  
  // Extract JSON from response, handling cases where LLM adds extra text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in LLM response: ${text.slice(0, 100)}`);
  }
  const parsed = JSON.parse(jsonMatch[0]) as AssertionResult;
  debug("bedrock", `evaluateAssertion response duration=${duration}ms`, { raw: result, parsed });
  return parsed;
}
