import * as core from "@actions/core";
import {
  getBranches,
  doesBranchExist,
  deleteBranch,
  createBranch,
  completeAllOperations,
} from "./api";
import { sleep } from "./utils";

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
        console.log(
          "Existing DB branch and relative endpoint succesfully deleted"
        );
      }
    }

    if (branchOperation === "create_branch") {
      console.log("Creating new DB branch...");
      const { operations } = await createBranch(branchName);
      console.log(
        "pending operations",
        JSON.stringify(operations, undefined, 2)
      );
      const results = await completeAllOperations(operations);
      console.log(
        "results from completing all ops",
        JSON.stringify(results, undefined, 2)
      );
      // const newEndpoint = results.find(operation => operation.action === "")
      // const newBranch = results.find(operation => operation.action === "")

      // // const { branch, endpoint } = data;
      // console.log(
      //   `Created new DB branch - { id: "${branch.id!}", status: "${
      //     branch.current_state
      //   }" }`
      // );

      // core.setOutput("host_url", endpoint.host);
      // core.setOutput("host_id", endpoint.id);
      // core.setOutput("branch_id", branch.id);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
