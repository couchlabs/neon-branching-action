import * as core from "@actions/core";
import fetch from "node-fetch";
import { sleep } from "./utils";

type Branch = { name?: string; id?: string; current_state?: string };
type Endpoint = { host: string; id: string };
type Branches = Array<Branch>;
type BranchesResponse = { branches: Branches };
type BranchResponse = { branch: Branch; endpoints: Endpoint[] };

// Action inputs, defined in action metadata file:
const apiKey = core.getInput("api_key");
const projectId = core.getInput("project_id");
const branchName = core.getInput("branch_name");

const BRANCHES_API_URL = `https://console.neon.tech/api/v2/projects/${projectId}/branches`;
const API_OPTIONS = {
  headers: {
    "content-type": "application/json",
    accept: "application/json",
    authorization: `Bearer ${apiKey}`,
  },
};

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

async function deleteBranchConfirmation(branch: Branch) {
  const { branches } = await getBranches();
  if (doesBranchExist(branches, branch.name ?? branchName)) {
    await sleep(2000);
    await deleteBranchConfirmation(branch);
  }
}

async function updateBranch(branch: Branch) {
  try {
    await fetch(`${BRANCHES_API_URL}/${branch.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        branch: { name: `${branch.name}--toDelete` },
      }),
      ...API_OPTIONS,
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function createBranch(branchName: string) {
  try {
    const response = await fetch(BRANCHES_API_URL, {
      method: "POST",
      body: JSON.stringify({
        branch: { name: branchName },
        endpoints: [{ type: "read_write" }],
      }),
      ...API_OPTIONS,
    });
    return response.json().then((data) => data as BranchResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    return { branch: {}, endpoints: [] };
  }
}

function doesBranchExist(branches: Branches, branchName: string) {
  return branches.find((branch) => branch.name === branchName);
}

export {
  getBranches,
  deleteBranch,
  createBranch,
  doesBranchExist,
  updateBranch,
  deleteBranchConfirmation,
};
