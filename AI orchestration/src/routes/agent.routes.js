import { Router } from "express";
import agent from "../agents/code.agent.js";
import axios from "axios";

const agentRouter = Router();

let isAgentBusy = false;

const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function buildPrompt(message, projectId) {
  const base = `http://sandbox-service-${projectId}:3000`;

  const list = await axios.get(`${base}/list-files`, { timeout: 10000 });
  const files = list.data.files;

  const read = await axios.get(`${base}/read-files`, {
    params: { files: "src/App.jsx" },
    timeout: 20000,
  });
  const appJsx = Object.values(read.data.files?.[0] || {})[0] || "";

  console.log(
    `[AI] Preloaded ${files.length} file paths and src/App.jsx (${appJsx.length} chars)`
  );

  return `User request: ${message}

Project files:
${files.join("\n")}

Current src/App.jsx:
${appJsx}`;
}

// Returns how long to wait before retrying, or null if the error should not be retried
function getRetryDelayMs(error) {
  const msg = error?.message || "";

  // Model wrote invalid JSON for a tool call. Nothing was executed yet, so retry quickly.
  if (msg.includes("tool_use_failed")) return 1000;

  // Groq rate limit: Groq says how long to wait, e.g. "Please try again in 13.17s"
  if (error?.status === 429 || msg.includes("429")) {
    let seconds = 10;
    const match = msg.match(/try again in ([\d.]+)(ms|s)/);
    if (match) {
      seconds = match[2] === "ms" ? parseFloat(match[1]) / 1000 : parseFloat(match[1]);
    }
    return Math.min(Math.max(seconds + 1, 5), 15) * 1000;
  }

  return null;
}

async function invokeWithRetry(input, config) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await agent.invoke(input, config);
    } catch (error) {
      const delay = getRetryDelayMs(error);
      if (delay === null || attempt >= MAX_ATTEMPTS) throw error;

      console.warn(
        `[AI] Attempt ${attempt} failed: ${(error.message || "").slice(0, 120)}`
      );
      console.warn(`[AI] Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
}

agentRouter.post("/invoke", async (req, res) => {
  const startedAt = Date.now();
  const { message, projectId } = req.body;

  if (!message || !projectId) {
    return res.status(400).json({
      error: "Message and projectId are required",
    });
  }

  // Prevent concurrent agent requests
  if (isAgentBusy) {
    return res.status(429).json({
      error: "Agent is currently busy",
      message: "Please wait for the current request to complete.",
    });
  }

  isAgentBusy = true;

  console.log("[AI] Invoke request received");
  console.log("[AI] Project ID:", projectId);
  console.log("[AI] Message length:", message.length);

  try {
    console.log("[AI] Calling agent.invoke()");

    const response = await invokeWithRetry(
      {
        messages: [
          {
            role: "user",
            content: await buildPrompt(message, projectId),
          },
        ],
      },
      {
        context: {
          projectId,
        },
      }
    );

    console.log(
      `[AI] Agent completed in ${Date.now() - startedAt}ms`
    );

    return res.json({ response });

  } catch (error) {
    console.error(
      `[AI] Agent failed after ${Date.now() - startedAt}ms:`,
      error.message
    );

    const isRateLimit = error.status === 429 ||
      error.message?.includes("429");

    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? "Groq rate limit exceeded"
        : "Failed to invoke agent",
      details: error.message,
    });

  } finally {
    isAgentBusy = false;
    console.log("[AI] Agent lock released");
  }
});

export default agentRouter;