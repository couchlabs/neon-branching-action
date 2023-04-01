import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";

async function run(): Promise<void> {
  try {
    // Action inputs, defined in action metadata file:
    // - api_key    : https://neon.tech/docs/manage/api-keys
    // - project_id : neon.tech project id
    const API_KEY = core.getInput("api_key");
    const PROJECT_ID = core.getInput("project_id");
    const BRANCH_NAME = core.getInput("branch_name");

    const res = await fetch(
      `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          branch: {
            name: BRANCH_NAME,
          },
          endpoints: {
            type: "read_write",
          },
        }),
      }
    );

    console.log(`branches ${res}`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
