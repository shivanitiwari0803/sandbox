
import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import {
  listFiles,
  readFiles,
  updateFiles
} from "./tools.js";

import { createAgent } from "langchain";

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0
});

const agent = createAgent({
  model,
  tools: [
    listFiles,
    readFiles,
    updateFiles
  ]
});

const response = await agent.invoke({
  messages: [
    {
      role: "user",
      content: `
Update the project to use a light theme.

Instructions:
1. First list the project files.
2. Read only the CSS files relevant to the theme.
3. Do not read unrelated React components or assets.
4. Remove dark-theme styles and ensure the background,
   text, buttons, and other UI elements use light-theme colors.
5. Use update_files to apply the changes.
6. Do not modify unrelated files.
`
    }
  ]
});

console.log(
  response.messages[response.messages.length - 1].content
);
