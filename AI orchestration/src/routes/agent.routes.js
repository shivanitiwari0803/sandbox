
import { Router } from "express";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
  const startedAt = Date.now();
  const { message, projectId } = req.body;

  console.log("[AI] Invoke request received");
  console.log("[AI] Project ID:", projectId);
  console.log("[AI] Message length:", message?.length);

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
      },
    );

    console.log(
      `[AI] Agent completed in ${Date.now() - startedAt}ms`
    );

    if (!res.headersSent) {
      res.json({ response });
    }
  } catch (error) {
    console.error(
      `[AI] Agent failed after ${Date.now() - startedAt}ms:`,
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to invoke agent",
        details: error.message,
      });
    }
  }
});

export default agentRouter;
