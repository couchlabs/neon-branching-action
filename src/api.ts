import * as core from "@actions/core";
import fetch from "node-fetch";
import { sleep } from "./utils";

type Branch = { name?: string; id?: string; current_state?: string };
type Endpoint = { host: string; id: string };
type Branches = Array<Branch>;
type BranchesResponse = { branches: Branches };
type Operation = {
  id: string;
  branch_id: string;
  endpoint_id?: string;
  action: string;
  status: string;
};
type BranchResponse = {
  branch: Branch;
  endpoints: Endpoint[];
  operations: Operation[];
};
type DeleteBranchResponse = {
  branch: Branch;
  operations: Operation[];
};
type OperationResponse = {
  operation: Operation;
};
// Action inputs, defined in action metadata file:
const apiKey = core.getInput("api_key");
const projectId = core.getInput("project_id");
const branchName = core.getInput("branch_name");

const BRANCHES_API_URL = `https://console.neon.tech/api/v2/projects/${projectId}/branches`;
const OPERATATIONS_API_URL = `https://console.neon.tech/api/v2/projects/${projectId}/operations`;
const ENDPOINTS_API_URL = `https://console.neon.tech/api/v2/projects/${projectId}/endpoints`;
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
    const data = await fetch(`${BRANCHES_API_URL}/${branch.id}`, {
      method: "DELETE",
      ...API_OPTIONS,
    });
    return data.json().then((data) => data as DeleteBranchResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    throw error;
  }
}

async function completeAllOperations(operations: Operation[]) {
  return Promise.all(operations.map(completeOperation));
}

async function completeOperation(pendingOperation: Operation) {
  const { operation } = await getOperation(pendingOperation);
  if (operation.status != "finished") {
    await sleep(500);
    await completeOperation(pendingOperation);
  }
  return operation;
}

async function getOperation(operation: Operation) {
  try {
    const response = await fetch(`${OPERATATIONS_API_URL}/${operation.id}`, {
      ...API_OPTIONS,
    });
    return response.json().then((data) => data as OperationResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    throw error;
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
    return await response.json().then((data) => data as BranchResponse);
  } catch (error: any) {
    core.setFailed(error.message);
    throw error;
  }
}

async function getBranch(branchId: string) {
  const response = await fetch(`${BRANCHES_API_URL}/${branchId}`, {
    ...API_OPTIONS,
  });
  return response.json().then((data) => data as { branch: Branch });
}

async function getEndpoint(endpointId: string) {
  const response = await fetch(`${ENDPOINTS_API_URL}/${endpointId}`, {
    ...API_OPTIONS,
  });
  return response.json().then((data) => data as { endpoint: Endpoint });
}

function doesBranchExist(branches: Branches, branchName: string) {
  return branches.find((branch) => branch.name === branchName);
}

export {
  getBranches,
  deleteBranch,
  createBranch,
  doesBranchExist,
  completeAllOperations,
};
