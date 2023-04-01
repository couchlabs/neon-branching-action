import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";

async function run(): Promise<void> {
  try {
    // Action inputs, defined in action metadata file:
    // - api_key     : https://neon.tech/docs/manage/api-keys
    // - project_id  : neon.tech project id
    // - branch_name : name for the new branch
    const API_KEY = core.getInput("api_key");
    const PROJECT_ID = core.getInput("project_id");
    const BRANCH_NAME = core.getInput("branch_name");
    console.log("API_KEY", API_KEY);
    console.log("PROJECT_ID", PROJECT_ID);
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Bearer ${API_KEY}`,
        },
        // body: JSON.stringify({
        //   branch: {
        //     name: BRANCH_NAME,
        //   },
        //   endpoints: [
        //     {
        //       type: "read_write",
        //     },
        //   ],
        // }),
      }
    );
    const data = await response.json();
    console.log("/branches response", JSON.stringify(data, undefined, 2));
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2);
    // console.log(`The event payload: ${payload}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
