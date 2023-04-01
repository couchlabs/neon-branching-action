import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";

// Action inputs, defined in action metadata file:
// - api_key     : https://neon.tech/docs/manage/api-keys
// - project_id  : neon.tech project id
// - branch_name : name for the new branch
const API_KEY = core.getInput("api_key");
const PROJECT_ID = core.getInput("project_id");
const BRANCH_NAME = core.getInput("branch_name");

const BRANCHES_API_URL = `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`;
const HEADERS = {
  "content-type": "application/json",
  accept: "application/json",
  authorization: `Bearer ${API_KEY}`,
};

async function run(): Promise<void> {
  try {
    const branches = await getBranches();
    console.log(
      "get /branches response",
      JSON.stringify(branches, undefined, 2)
    );
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2);
    // console.log(`The event payload: ${payload}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function getBranches() {
  try {
    console.log("API_KEY", API_KEY);
    console.log("PROJECT_ID", PROJECT_ID);
    const response = await fetch(BRANCHES_API_URL, {
      headers: HEADERS,
    });
    return response.json();
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
