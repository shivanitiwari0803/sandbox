import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

export const listFiles = tool(
  async () => {
    console.log("===================");
    console.log("listfiles tool is used");
    console.log("===================");

    const response = await axios.get(
      "http://sandbox-service-01a1d082-0583-700b-9d26-de3d4b982c20:3000/list-files",
    );

    console.log("===================");
    console.log("response from listfile is ", response.data);
    console.log("===================");

    return JSON.stringify(response.data.files);
  },
  {
    name: "list_files",
    description:
      "List all the files in the project directory. This is useful for understanding what  are available to work with.",
    schema: z.object({}),
  },
);

export const readFiles = tool(
  async ({ files }) => {
    console.log("===================");
    console.log("readfiles tool is used", files);
    console.log("===================");

    const response = await axios.get(
      "http://sandbox-service-01a1d082-0583-700b-9d26-de3d4b982c20:3000/read-files?files=" +
        files.join(","),
    );

    console.log("===================");
    console.log("response from readfile is ", response.data);
    console.log("===================");

    return JSON.stringify(response.data.files);
  },
  {
    name: "read_files",
    description:
      "Read the contents of specified files. This is useful for understanding the content of files that are relevant to the task at hand.",
    schema: z.object({
      files: z
        .array(z.string())
        .describe(
          "The list of files absolute paths to read. These should be files that were listed using the list_files tool or created later",
        ),
    }),
  },
);

export const updateFiles = tool(
  async ({ files }) => {
    console.log("===================");
    console.log("updatefiles tool is used", files);
    console.log("===================");

    const response = await axios.patch(
      "http://sandbox-service-01a1d082-0583-700b-9d26-de3d4b982c20:3000/update-files",
      {
        updates: files,
      },
    );
    console.log("===================");
    console.log("response from updatefile is ", response.data);
    console.log("===================");

    return JSON.stringify(response.data.results);
  },
  {
    name: "update_files",
    description:
      "update the contents of specified files. This is useful for making changes to file based on the requirements of the task at hand.",
    schema: z.object({
      files: z
        .array(
          z.object({
            file: z.string().describe("The file path to update"),
            content: z.string().describe("The new file content"),
          }),
        )
        .describe("The list of files to update and their new contents"),
    }),
  },
);

export const createFiles = tool(
  async ({ files }) => {
    const response = await axios.post(
      "http://sandbox-service-01a1d082-0583-700b-9d26-de3d4b982c20:3000/create-files",
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
