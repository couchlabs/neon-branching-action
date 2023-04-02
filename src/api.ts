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

async function getOperation(operation: Operation) {
  try {
    const response = await fetch(`${OPERATATIONS_API_URL}/${operation.id}`, {
      ...API_OPTIONS,
    });
    return response.json().then((data) => data as { operation: Operation });
  } catch (error: any) {
    core.setFailed(error.message);
    return { operation: { status: undefined } };
  }
}

async function operatoionConfirmation(creatingBranchOperation: Operation) {
  const { operation } = await getOperation(creatingBranchOperation);
  console.log("operation", operation);
  if (operation.status != "finish") {
    await sleep(2000);
    await operatoionConfirmation(creatingBranchOperation);
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
    const { operations } = await response
      .json()
      .then((data) => data as BranchResponse);

    console.log("oprations", JSON.stringify(operations, undefined, 2));

    const creatingBranchOperation = operations.find(
      (operation) => operation.action === "create_branch"
    );
    if (creatingBranchOperation != null) {
      console.log(
        "creatingBranchOperation",
        JSON.stringify(creatingBranchOperation, undefined, 2)
      );
      await operatoionConfirmation(creatingBranchOperation);
    } else {
      throw new Error("Something went wrong when trying to create new branch");
    }

    const creatingEndpointOperation = operations.find(
      (operation) => operation.action === "start_compute"
    );
    if (creatingEndpointOperation != null) {
      console.log(
        "creatingEndpointOperation",
        JSON.stringify(creatingEndpointOperation, undefined, 2)
      );
      await operatoionConfirmation(creatingEndpointOperation);
    } else {
      throw new Error("Something went wrong when trying to create new branch");
    }

    // get branch and get endpoint
    const { branch } = await getBranch(creatingBranchOperation.branch_id);
    const { endpoint } = await getEndpoint(
      creatingEndpointOperation.endpoint_id!
    );

    return { branch, endpoint };
  } catch (error: any) {
    core.setFailed(error.message);
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
  updateBranch,
  deleteBranchConfirmation,
};
