import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

export const listFiles = tool(
  async () => {
    console.log("===================");
    console.log("listfiles tool is used");
    console.log("===================");

    const response = await axios.get(
      "http://01a1930b-a06b-73e0-97af-5ec84bd12a3e.agent.localhost/list-files",
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
      "http://01a1930b-a06b-73e0-97af-5ec84bd12a3e.agent.localhost/read-files?files=" +
        files.join(","),
    );

    console.log("===================");
    console.log("response from readfile is ", response.data);
    console.log("===================");

    return JSON.stringify(response.data);
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
    console.log("readfiles tool is used", files);
    console.log("===================");

    const response = await axios.patch(
      "http://01a1930b-a06b-73e0-97af-5ec84bd12a3e.agent.localhost/update-files",
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
      "update the contents of specified files. This is useful for making chnages to file based on the requirements of the task at hand. This tool can also use to create new files by providing a new file name in the file field and the content to be added in the content field.",
    schema: z.object({
      files: z.array(
        z
          .object({
            path: z
              .string()
              .describe("The absolute path of the file to update"),
            content: z.string().describe("The new content for the file"),
          })
      ).describe("The list of files to update and their new contents")
    }),
  },
);
