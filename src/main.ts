import * as core from "@actions/core";
import {
  getBranches,
  doesBranchExist,
  deleteBranch,
  createBranch,
  completeAllOperations,
  getBranch,
  getEndpoint,
  promoteBranch,
  OperationAction,
} from "./api";
import { Actions } from "./messages";
import { notNull } from "./utils";

// Action inputs, defined in action metadata file:
const branchName = notNull(core.getInput("branch_name"));
const branchOperation = notNull(core.getInput("branch_operation"));

async function run(): Promise<void> {
  if (
    branchOperation === "create_branch" ||
    branchOperation === "delete_branch"
  ) {
    try {
      if (
        branchOperation === "create_branch" ||
        branchOperation === "delete_branch"
      ) {
        const { branches } = await getBranches();
        const branch = doesBranchExist(branches, branchName);

        if (branch != null) {
          console.log(Actions.BRANCH_DELETING);
          const { operations } = await deleteBranch(branch);
          await completeAllOperations(operations);
          console.log(Actions.BRANCH_DELETED);
        }
      }

      if (branchOperation === "create_branch") {
        console.log(Actions.BRANCH_CREATING);
        const { operations } = await createBranch(branchName);
        const results = await completeAllOperations(operations);
        console.log(Actions.BRANCH_CREATED);

        const newBranch = notNull(
          results.find((op) => op.action === OperationAction.CREATE_BRANCH)
        );
        const newEndpoint = notNull(
          results.find((op) => op.action === OperationAction.START_COMPUTE)
        );

        const [{ branch }, { endpoint }] = await Promise.all([
          getBranch(newBranch.branch_id),
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
  if (branchOperation === "promote_branch") {
    try {
      const { branches } = await getBranches();
      const branch = doesBranchExist(branches, branchName);

      if (branch != null) {
        console.log(Actions.BRANCH_PROMOTING);
        const { operations } = await promoteBranch(branch);
        await completeAllOperations(operations);
        console.log(Actions.BRANCH_PROMOTED);
      }
    } catch (error: any) {
      core.setFailed(error.message);
    }
  }
}

run();
