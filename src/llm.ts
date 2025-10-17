import OpenAI from 'openai';

export interface LLMResult {
  intent: string;
  command: string | null;
  terminal: string | null;
  search: string | null;
  confidence: number;
  alternatives: Array<{ command: string | null; description?: string; terminal?: string | null }>;
  isCommandHistorySidebar?: boolean;
}

export async function getLLMResult(apiKey: string, userInput: string, model: string): Promise<LLMResult & { rawResponse?: any; error?: string }> {
  const openai = new OpenAI({ apiKey });
  const systemPrompt = `You are an assistant that maps natural language requests to Visual Studio Code commands.\nIf the user request is best handled by running a terminal command, respond with a JSON object in the following format:\n{\n  "intent": "short description of the user's intent",\n  "command": "the most likely VS Code command id (or null if not applicable)",\n  "terminal": "the terminal command to run, or null if not applicable",\n  "search": "the search term if the intent is to search the workspace, or null if not applicable",\n  "confidence": 0-1,\n  "alternatives": [\n    {"command": "alternative command id", "description": "when to use", "terminal": "alternative terminal command or null"}\n  ],\n  "isCommandHistorySidebar": true if the user's request is semantically asking to open the command history sidebar, false otherwise\n}\nIf the user request is to search the workspace, always set the 'search' property to the search term.\nIf the user asks to open, show, or see any of the following, map to the corresponding VS Code command:\n- Explorer: workbench.view.explorer\n- Extensions: workbench.view.extensions\n- Source Control: workbench.view.scm\n- Debug: workbench.view.debug\n- Run: workbench.view.run\n- Testing: workbench.view.testing\n- GitHub Pull Requests: github.pullRequests.explorer\n- Remote Explorer: workbench.view.remote\nIf the user's request is semantically asking to open the command history sidebar (even if not using those exact words), set isCommandHistorySidebar to true.\nFor terminal commands:\n- If the user wants to list only directories/folders (not files), use: "list directories recursively"\n- If the user wants to list both files and directories, use: "ls" or "dir"\nRespond with only the JSON object and nothing else.`;
  const prompt = `${systemPrompt}\nUser request: "${userInput}"`;
  const response = await openai.responses.create({
    model: model || 'gpt-4o',
    input: prompt
  });
  let jsonText = response.output_text || '';
  try {
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) { throw new Error('Could not parse LLM response as JSON.'); }
    const parsed = JSON.parse(match[0]);
    return {
      intent: parsed.intent || '',
      command: parsed.command || null,
      terminal: parsed.terminal || null,
      search: parsed.search || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      isCommandHistorySidebar: typeof parsed.isCommandHistorySidebar === 'boolean' ? parsed.isCommandHistorySidebar : false,
      rawResponse: response
    };
  } catch (err) {
    // Log the error and raw response for debugging
    console.error('Failed to parse LLM response as JSON:', err, '\nRaw response:', jsonText);
    return {
      intent: '',
      command: null,
      terminal: null,
      search: null,
      confidence: 0,
      alternatives: [],
      isCommandHistorySidebar: false,
      rawResponse: response,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}