
import { Router } from "express";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

let isAgentBusy = false;

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

    const response = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: message,
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
