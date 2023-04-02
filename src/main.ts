import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";

type Branch = { name?: string; id?: string };
type Branches = Array<Branch>;
type BranchesResponse = { branches: Branches };
type BrancheResponse = { branch: Branch };

// Action inputs, defined in action metadata file:
// - api_key     : https://neon.tech/docs/manage/api-keys
// - project_id  : neon.tech project id
// - branch_name : name for the new branch
const API_KEY = core.getInput("api_key");
const PROJECT_ID = core.getInput("project_id");
const BRANCH_NAME = core.getInput("branch_name");

const BRANCHES_API_URL = `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`;
const API_OPTIONS = {
  headers: {
    "content-type": "application/json",
    accept: "application/json",
    authorization: `Bearer ${API_KEY}`,
  },
};

async function run(): Promise<void> {
  try {
    const { branches } = await getBranches();
    const existingBranch = doesBranchExist(branches);
    if (existingBranch != null) {
      console.log(`Deleting existing DB branch "${existingBranch.name}"`);
      await deleteBranch(existingBranch);
    }
    console.log(`Creating DB branch "${BRANCH_NAME}"`);
    const { branch } = await createBranch();
    console.log("Created DB branch", JSON.stringify(branch, undefined, 2));

    // create
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

// Helper functions
async function getBranches() {
  try {
    const response = await fetch(BRANCHES_API_URL, API_OPTIONS);
    return response.json().then((data) => data as BranchesResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    return { branches: [] };
  }
}

async function deleteBranch(branch: Branch) {
  try {
    await fetch(`${BRANCHES_API_URL}/${branch.id}`, {
      method: "DELETE",
      ...API_OPTIONS,
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function createBranch() {
  try {
    const response = await fetch(BRANCHES_API_URL, {
      method: "POST",
      body: JSON.stringify({
        branch: { name: BRANCH_NAME },
        endpoints: [{ type: "read_write" }],
      }),
      ...API_OPTIONS,
    });
    return response.json().then((data) => data as BrancheResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    return { branch: {} };
  }
}

function doesBranchExist(branches: Branches) {
  return branches.find((branch) => branch.name === BRANCH_NAME);
}
