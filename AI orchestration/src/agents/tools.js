import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";


export const listFiles = tool(
  async ({}, config) => {
    const projectId = config?.context?.projectId;

    if (!projectId) {
      throw new Error("Project ID is missing");
    }

    console.log("[Tool] list_files started");

    const response = await axios.get(
      `http://sandbox-service-${projectId}:3000/list-files`,
      {
        timeout: 10000,
      }
    );

    const files = response.data.files;

    console.log(`[Tool] Found ${files.length} files`);

    return JSON.stringify(files);
  },
  {
    name: "list_files",
    description:
      "List project file paths. Always call this first to understand the project structure. Do not read file contents using this tool.",
    schema: z.object({}),
  },
);



export const readFiles = tool(
  async ({ files }, config) => {
    const projectId = config?.context?.projectId;

    if (!projectId) {
      throw new Error("Project ID is missing");
    }

    const uniqueFiles = [...new Set(files)];

    if (uniqueFiles.length > 5) {
      throw new Error("Maximum 5 files allowed per read operation");
    }

    console.log(`[Tool] Reading ${uniqueFiles.length} files`);

    const response = await axios.get(
      `http://sandbox-service-${projectId}:3000/read-files`,
      {
        params: {
          files: uniqueFiles.join(","),
        },
        timeout: 20000,
      }
    );

    console.log("[Tool] File reading completed");

    return JSON.stringify(response.data.files);
  },
  {
    name: "read_files",
      description:
      "Read project files. Call this tool ONLY ONCE per task: pass every file you need together in the files array (max 5). Use paths returned by list_files.",
    schema: z.object({
      files: z
        .array(z.string().min(1))
        .min(1)
        .max(5)
        .describe(
          "Absolute paths of relevant project files discovered using list_files"
        ),
    }),
  }
);



export const updateFiles = tool(
  async ({ files }, config) => {
    const projectId = config?.context?.projectId;

    if (!projectId) {
      throw new Error("Project ID is missing");
    }

    if (!files?.length) {
      throw new Error("No files provided");
    }

    const filePaths = files.map(({ file }) => file);

    if (new Set(filePaths).size !== filePaths.length) {
      throw new Error("Duplicate file paths are not allowed");
    }

    console.log("[AI] update_files called:", filePaths);

    const response = await axios.patch(
      `http://sandbox-service-${projectId}:3000/update-files`,
      {
        updates: files,
      },
      {
        timeout: 30000,
      }
    );

    console.log("[AI] Files processed:", response.data.results?.length);

    return `Done. Files updated: ${filePaths.join(", ")}. Task complete. Do not call any more tools.`;
  },
  {
    name: "update_files",
    returnDirect: true,
    description:
      "Create new files or update existing files in the project. Handles both create and update. Always provide the complete file path and complete file content. Call this once with all changed files.",
    schema: z.object({
      files: z
        .array(
          z.object({
            file: z.string().min(1).describe("Absolute file path"),
            content: z.string().describe("Complete file content"),
          })
        )
        .min(1)
        .describe("Files to create or update"),
    }),
  }
);


export const createFiles = tool(
  async ({ files },config) => {
    const response = await axios.post(
      `http://sandbox-service-${config.context.projectId}:3000/create-files`,
      {
        files,
      },
    );

    return JSON.stringify(response.data.results);
  },
  {
    name: "create_files",
    description:
      "Create new files in the project. Use this when a required file does not already exist. Do not use this to overwrite existing files.",
    schema: z.object({
      files: z.array(
        z.object({
          file: z.string(),
          content: z.string(),
        }),
      ),
    }),
  },
);
