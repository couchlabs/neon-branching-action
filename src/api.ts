import * as core from "@actions/core";
import fetch from "node-fetch";
import { notNull, sleep } from "./utils";

type Branch = { name: string; id: string };
type Branches = Branch[];
type Endpoint = { host: string; id: string };
type Endpoints = Endpoint[];
type Operation = {
  id: string;
  branch_id: string;
  endpoint_id?: string;
  action: string;
  status: string;
};
type Operations = Operation[];

type CreateBranchResponse = {
  branch: Branch;
  endpoints: Endpoints;
  operations: Operations;
};
type GetBranchesResponse = { branches: Branches };
type DeleteBranchResponse = {
  branch: Branch;
  operations: Operations;
};
type PromoteBranchResponse = {
  branch: Branch;
  operations: Operations;
};
type GetOperationResponse = {
  operation: Operation;
};

export enum OperationAction {
  CREATE_BRANCH = "create_branch",
  START_COMPUTE = "start_compute",
}

// Action inputs, defined in action metadata file:
const apiKey = notNull(core.getInput("api_key"));
const projectId = notNull(core.getInput("project_id"));
// API constants and utils
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

// Branch functions
// ================
// Get the list of all branches currently available
async function getBranches() {
  const response = await fetch(BRANCHES_API_URL, API_OPTIONS);
  return response.json().then((data) => data as GetBranchesResponse);
}

// Get the detail of a specific branch
async function getBranch(branchId: string) {
  const response = await fetch(`${BRANCHES_API_URL}/${branchId}`, {
    ...API_OPTIONS,
  });
  return response.json().then((data) => data as { branch: Branch });
}

// Create a new branch
async function createBranch(branchName: string) {
  const response = await fetch(BRANCHES_API_URL, {
    method: "POST",
    body: JSON.stringify({
      branch: { name: branchName },
      endpoints: [{ type: "read_write" }],
    }),
    ...API_OPTIONS,
  });
  return await response.json().then((data) => data as CreateBranchResponse);
}

// Find a specific branch
function doesBranchExist(branches: Branches, branchName: string) {
  return branches.find((branch) => branch.name === branchName);
}

// Delete a specific branch
async function deleteBranch(branch: Branch) {
  const data = await fetch(`${BRANCHES_API_URL}/${branch.id}`, {
    method: "DELETE",
    ...API_OPTIONS,
  });
  return data.json().then((data) => data as DeleteBranchResponse);
}

// Promote a specific branch
async function promoteBranch(branch: Branch) {
  const data = await fetch(`${BRANCHES_API_URL}/${branch.id}/set_as_primary`, {
    method: "POST",
    ...API_OPTIONS,
  });
  return data.json().then((data) => data as PromoteBranchResponse);
}

// Operations functions
// ====================
// Return a promise fulfilling when all the operations are finished
async function completeAllOperations(operations: Operation[]) {
  return Promise.all(operations.map(completeOperation));
}

// Return a promise fullfilling when a specific operation finishes
async function completeOperation(pendingOperation: Operation) {
  const { operation } = await getOperation(pendingOperation);
  if (operation.status != "finished") {
    await sleep(500);
    await completeOperation(pendingOperation);
  }
  return operation;
}

// Get the detail of a specific operation
async function getOperation(operation: Operation) {
  const response = await fetch(`${OPERATATIONS_API_URL}/${operation.id}`, {
    ...API_OPTIONS,
  });
  return response.json().then((data) => data as GetOperationResponse);
}

// Endpoints functions
// ====================
// Get the detail of a specific endpoint
async function getEndpoint(endpointId: string) {
  const response = await fetch(`${ENDPOINTS_API_URL}/${endpointId}`, {
    ...API_OPTIONS,
  });
  return response.json().then((data) => data as { endpoint: Endpoint });
}

export {
  getBranch,
  getEndpoint,
  getBranches,
  deleteBranch,
  createBranch,
  promoteBranch,
  doesBranchExist,
  completeAllOperations,
};
