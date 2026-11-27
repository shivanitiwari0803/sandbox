import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import { updateFiles } from "./tools.js";

import { createAgent } from "langchain";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
  maxTokens: 4096,
  maxRetries: 5,
  modelKwargs: { reasoning_effort: "low" },
  callbacks: [
    {
      handleLLMEnd(output) {
        const msg = output.generations?.[0]?.[0]?.message;
        console.log(
          "[AI] LLM call tokens:",
          JSON.stringify(msg?.usage_metadata),
          "finish_reason:",
          msg?.response_metadata?.finish_reason
        );
      },
    },
  ],
});

const systemPrompt = `You are a senior frontend engineer working inside a sandboxed React (Vite) project.

The project file list and the current contents of src/App.jsx are given in the user message.
Do the user's request by calling update_files EXACTLY ONCE with every file you change or create, each with its complete content.

RULES:
- update_files is your only tool. You cannot read other files.
- To build a new page or site, replace src/App.jsx and src/App.css completely with new code. Do not keep old template styles. For a small edit to an existing page, change only what is needed.
- NEVER use any image files from the project (hero.png, react.svg, vite.svg or anything in src/assets). They are leftover template files, not real product photos.
- For product pictures use a large emoji (for example 👕 👖 🧥 👗 🧢 👟) centered inside a fixed-height box (height 200px) with a soft gradient background. For a hero section use a gradient background with text only, no image.
- Put all content in a centered container with max-width 1100px and padding 0 20px. Use grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) for product grids so cards stay the same size.
- Build a polished page: navbar, hero with a heading and a call-to-action button, a card grid, and a footer. Use a consistent color palette in CSS variables, generous spacing, rounded corners, soft shadows, hover effects, and one media query for mobile.
- Use realistic sample content (names, prices, short descriptions), not lorem ipsum.
- Keep the CSS compact. Preserve the existing framework and dependencies.
- Never claim code was tested or executed.
- After update_files succeeds, stop.`;

const agent = createAgent({
  model,
  tools: [updateFiles],
  systemPrompt,
}).withConfig({
  recursionLimit: 12,
});

export default agent;