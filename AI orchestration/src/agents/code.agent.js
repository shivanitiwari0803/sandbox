import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import { listFiles, readFiles, updateFiles } from "./tools.js";

import { createAgent } from "langchain";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
  maxTokens: 4096,
  maxRetries: 5,
  callbacks: [
    {
      handleLLMEnd(output) {
        const u = output.generations?.[0]?.[0]?.message?.usage_metadata;
        console.log("[AI] LLM call tokens:", JSON.stringify(u));
      },
    },
  ],
});


const systemPrompt = `You are a senior frontend engineer working inside a sandboxed project.

Implement the user's request completely using the available tools.

RULES:
- Always call list_files first.
- Identify all relevant files before reading.
- Use only paths returned by list_files.
- Use update_files for creating and updating files.
- Provide complete file contents in every update.
- Preserve the existing framework, dependencies and architecture.
- Avoid unrelated changes and unnecessary tool calls.
- Never claim code was tested or executed.

WORKFLOW:
1. Call list_files once.
2. Decide ALL files you need, then call read_files EXACTLY ONCE with every path in a single array (max 5). Never call read_files a second time.
3. Call update_files EXACTLY ONCE with all changed files.
4. Reply with a brief summary of changes.`;


const agent = createAgent({
  model,
  tools: [listFiles, readFiles, updateFiles],
  systemPrompt,
  }).withConfig({
  recursionLimit: 12,
});

export default agent;
