import * as core from "@actions/core";
import {
  getBranches,
  doesBranchExist,
  deleteBranch,
  createBranch,
} from "./api";
import { sleep } from "./utils";

// Action inputs, defined in action metadata file:
const branchName = core.getInput("branch_name");
const BRANCH_OPERATION = core.getInput("branch_operation");

async function run(): Promise<void> {
  try {
    if (
      BRANCH_OPERATION === "create_branch" ||
      BRANCH_OPERATION === "delete_branch"
    ) {
      const { branches } = await getBranches();
      const existingBranch = doesBranchExist(branches, branchName);

      if (existingBranch != null) {
        console.log("Deleting existing DB branch...");
        await deleteBranch(existingBranch);
        console.log(
          `Deleted existing DB branch - { name: "${existingBranch.name}", id: "${existingBranch.id}" }`
        );
        await sleep(1000);
      }
    }

    if (BRANCH_OPERATION === "create_branch") {
      console.log("Creating new DB branch...");
      const { branch, endpoints } = await createBranch(branchName);
      console.log(
        `Created new DB branch - { name: "${branch.name}", id: "${branch.id}", status: "${branch.pending_state}" }`
      );

      core.setOutput("host_url", endpoints[0].host);
      core.setOutput("host_id", endpoints[0].id);
      core.setOutput("branch_id", branch.id);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
