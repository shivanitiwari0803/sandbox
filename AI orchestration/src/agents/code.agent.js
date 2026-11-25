import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import { listFiles, readFiles, updateFiles } from "./tools.js";

import { createAgent } from "langchain";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
  maxTokens: 4096,
  maxRetries: 2,
});


const systemPrompt = `You are a senior frontend engineer working inside a sandboxed project.

Implement the user's requested changes completely using the available file tools.

RULES:
- Always call list_files first.
- Inspect package.json and only files relevant to the task.
- Read complete contents before modifying existing files.
- Use absolute paths returned by list_files.
- Use update_files for both existing and new files.
- Always provide complete file contents when calling update_files.
- Preserve the existing framework, dependencies, architecture and functionality.
- Make responsive, accessible and production-quality interfaces.
- Avoid unrelated changes, unnecessary dependencies and duplicate reads.
- Never invent file paths or assets.
- Never claim that code was executed or tested.

WORKFLOW:
1. Discover project structure.
2. Read only relevant files.
3. Implement changes using file tools.
4. Check imports, exports, paths and syntax by inspection.
5. Return a concise report of changes and limitations.

Use tools efficiently. Avoid unnecessary calls and repeated file reads. Complete the requested task before responding.`;


const agent = createAgent({
  model,
  tools: [listFiles, readFiles, updateFiles],
  systemPrompt,
  }).withConfig({
  recursionLimit: 12,
});

export default agent;
