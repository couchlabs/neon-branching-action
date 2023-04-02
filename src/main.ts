import * as core from "@actions/core";
import {
  getBranches,
  doesBranchExist,
  deleteBranch,
  createBranch,
  completeAllOperations,
  getBranch,
  getEndpoint,
} from "./api";

// Action inputs, defined in action metadata file:
const branchName = core.getInput("branch_name");
const branchOperation = core.getInput("branch_operation");
const apiKey = core.getInput("api_key");
const projectId = core.getInput("project_id");

async function run(): Promise<void> {
  // TODO: move into validator utility
  if (!branchName || !branchOperation || !apiKey || !projectId) {
    core.setFailed("Missing required input");
    return;
  }

  try {
    if (
      branchOperation === "create_branch" ||
      branchOperation === "delete_branch"
    ) {
      const { branches } = await getBranches();
      const branch = doesBranchExist(branches, branchName);

      if (branch != null) {
        // TODO move into message helpers
        console.log(`Deleting existing DB branch...`);
        const { operations } = await deleteBranch(branch);
        await completeAllOperations(operations);
        console.log("Existing DB branch and endpoint succesfully deleted");
      }
    }

    if (branchOperation === "create_branch") {
      console.log("Creating new DB branch...");
      const { operations } = await createBranch(branchName);
      const results = await completeAllOperations(operations);
      console.log("New DB branch and endpoint succesfully created");

      const newBranch = results.find((op) => op.action === "create_branch");
      const newEndpoint = results.find((op) => op.action === "start_compute");
      // TODO Move into util validator
      if (!newBranch || !newEndpoint) {
        throw new Error(
          `Some operations were missing. create_branch: ${JSON.stringify(
            newBranch
          )} | start_compute: ${JSON.stringify(newBranch)}`
        );
      }

      const [{ branch }, { endpoint }] = await Promise.all([
        getBranch(newBranch.id),
        getEndpoint(newEndpoint.endpoint_id!),
      ]);

      core.setOutput("host_url", endpoint.host);
      core.setOutput("host_id", endpoint.id);
      core.setOutput("branch_id", branch.id);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
