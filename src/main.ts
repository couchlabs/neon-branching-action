import * as core from "@actions/core";
import {
  getBranches,
  doesBranchExist,
  deleteBranch,
  createBranch,
  updateBranch,
  deleteBranchConfirmation,
} from "./api";
import { sleep } from "./utils";

// Action inputs, defined in action metadata file:
const branchName = core.getInput("branch_name");
const branchOperation = core.getInput("branch_operation");
const apiKey = core.getInput("api_key");
const projectId = core.getInput("project_id");

async function run(): Promise<void> {
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
      const existingBranch = doesBranchExist(branches, branchName);

      if (existingBranch != null) {
        // console.log("Tagging existing DB branch for deletion...");
        // await updateBranch(existingBranch);
        // Need to check operations
        // Abstract a function to extract operations and for each keep pulling until it's finished.
        console.log("Deleting existing DB branch...");
        const data = await deleteBranch(existingBranch);
        console.log(
          "response from deleting branch: ",
          JSON.stringify(data, undefined, 2)
        );
        await deleteBranchConfirmation(existingBranch);
        console.log(
          `Deleted existing DB branch - { name: "${existingBranch.name}", id: "${existingBranch.id}" }`
        );
      }
    }

    if (branchOperation === "create_branch") {
      console.log("Creating new DB branch...");
      const data = await createBranch(branchName);
      if (!data?.branch || !data?.endpoint) {
        throw new Error("something went wrong");
      }

      const { branch, endpoint } = data;
      console.log(
        `Created new DB branch - { id: "${branch.id!}", status: "${
          branch.current_state
        }" }`
      );

      core.setOutput("host_url", endpoint.host);
      core.setOutput("host_id", endpoint.id);
      core.setOutput("branch_id", branch.id);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
