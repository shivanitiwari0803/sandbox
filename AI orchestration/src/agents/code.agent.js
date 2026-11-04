import "dotenv/config"
import { ChatGoogle } from "@langchain/google/node";
import {listFiles, readFiles, updateFiles} from "./tools.js"
import { createAgent } from "langchain";

const model = new ChatGoogle({
    model: "gemini-3.6-flash",
    apiKey: process.env.GEMINI_API_KEY
});

const agent = createAgent({
    model,
    tools:[listFiles,readFiles,updateFiles]
})

agent.invoke({
    messages: [
        {
            role: "user",
            content: "update the theme of the project to light"
        }
    ]
})