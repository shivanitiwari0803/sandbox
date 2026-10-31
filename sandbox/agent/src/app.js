import express from "express";
import morgan from "morgan";
import fs from "fs";
import path from "path";

const WORKING_DIR = "/workspace";
const app = express();

app.use(morgan("dev"));
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ok from sandbox agent",
    status: "success",
  });
});

/**
 * @route GET /list-files
 * @description Lists all the files in the working directory and its subdirectories. Returns a JSON object with the file paths relative to the working directory.
 */
app.get("/list-files", async (req, res) => {

  const listFiles = async (dir, baseDir) => {
    const files = [];

    const entries = await fs.promises.readdir(dir, {
      withFileTypes: true
    });

    for (const entry of entries) {

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (
        entry.isDirectory() &&
        ["node_modules", ".git", "dist"].includes(entry.name)
      ) {
        continue;
      }

      if (entry.isDirectory()) {

        files.push(
          ...await listFiles(fullPath, baseDir)
        );

      } else {

        files.push(relativePath);

      }
    }

    return files;
  };

  try {
    const files = await listFiles(WORKING_DIR, WORKING_DIR);

    res.status(200).json({
      message: "Files listed successfully",
      files
    });

  } catch (err) {
    res.status(500).json({
      message: `Error listing files: ${err.message}`,
      status: "error"
    });
  }
});


/**
 * @route GET /read-files
 * @description Reads the content of all the fikles requested in query parameter "files" and return their content as json
 */
app.get("/read-files", async (req, res) => {
  const files = req.query.files;

  if (!files) {
    return res.status(400).json({
      message: "No files specified in query parameter",
      status: "error",
    });
  }
  const fileList = files.split(",");

  const results = await Promise.all(
    fileList.map(async (file) => {
      const filePath = path.join(WORKING_DIR,file)
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");

        return {
          [filePath.replace(WORKING_DIR ,"")]: content,
        };
      } catch (err) {
        return {
          [filePath.replace(WORKING_DIR ,"")]: `Error reading file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "File contents",
    files: results,
  });
});

/**
 * @route PATCH /update-file
 * @description updates the content of files specified in the request body. The request body should be a JSON array objects
 */
app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message:
        'INvalid requesy body. Expected a JSON object with an "updates" property containing an array of file updates. ',
      status: "error",
    });
  }

  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update;
      const filePath = path.join(WORKING_DIR, file);
      try {
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "file upload successfully",
        };
      } catch (err) {
        return {
          [filePath]: `Error updating file :${err.message}`,
        };
      }
    }),
  );
  res.status(200).json({
    message: "file update results",
    results,
  });
});

/**
 * @route POST /create-files
 * @description Create a new file withe the content specified in the request body. The request body should contain a property 'files' with a JSON array of objects, each objects should have a 'file' 
 */

app.post("/create-files", async(req,res)=>{
    const files = req.body.files

    if(!files || !Array.isArray(files)){
        return res.status(400).json({
            message: "Invalid request body. Expected a JSON object with a 'files' property containing an array",
            status: 'error'
        })
    }

    const results = await Promise.all(files.map(async (fileObj) =>{
        const {file,content} = fileObj;
        const filePath = path.join(WORKING_DIR,file)
        const directoryPath = path.dirname(filePath);
        try{
            await fs.promises.mkdir(directoryPath, {
          recursive: true
        });
            await fs.promises.writeFile(filePath,content,"utf-8")
            return {
                [filePath.replace(WORKING_DIR ,"")]: 'file created successfully'
            }
        } catch (err){
            return {
                [filePath.replace(WORKING_DIR ,"")] : `Error creating file: ${err.message}`
            }
        }
    }))

    res.status(200).json({
        message:"file created successfully",
        results
    })
})

export default app;
