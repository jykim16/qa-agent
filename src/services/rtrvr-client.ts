const API_BASE = "https://api.rtrvr.ai";

function getApiKey(): string {
  const key = process.env.RTRVR_API_KEY;
  if (!key) throw new Error("RTRVR_API_KEY environment variable required");
  return key;
}

export interface AgentResponse {
  success: boolean;
  result?: { text?: string; json?: unknown };
  screenshot?: string;
  error?: string;
  trajectoryId: string;
}

export async function executeAgenticStep(
  instruction: string,
  urls: string[],
  trajectoryId?: string
): Promise<AgentResponse> {
  const response = await fetch(`${API_BASE}/agent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: instruction,
      urls,
      trajectoryId,
      response: { verbosity: "final" },
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: `API error: ${response.status}`,
      trajectoryId: trajectoryId || "",
    };
  }

  const data = await response.json() as any;
  return {
    success: data.success,
    result: data.result,
    trajectoryId: data.trajectoryId,
    error: data.success ? undefined : "Agent execution failed",
  };
}

export interface ScrapeResponse {
  success: boolean;
  content?: string;
  tree?: string;
  error?: string;
}

export async function scrapePage(url: string): Promise<ScrapeResponse> {
  const response = await fetch(`${API_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls: [url] }),
  });

  if (!response.ok) {
    return { success: false, error: `API error: ${response.status}` };
  }

  const data = await response.json() as any;
  const tab = data.tabs?.[0];
  return {
    success: data.success,
    content: tab?.content,
    tree: tab?.tree,
    error: data.success ? undefined : "Scrape failed",
  };
}
