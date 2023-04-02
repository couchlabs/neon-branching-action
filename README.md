## Create a Neon Branch 🚀
This gitHub action creates a new Neon branch.
If the branch already exist, it will be deleted and re-created.

Here is an example of how to use it:

```yml
name: Create Neon Branch with GitHub Actions Demo
run-name: Create a Neon Branch 🚀
jobs:
  create-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: couchlabs/neon-branching-action@main
        with:
          api_key: ${{ secrets.NEON_API_KEY }}
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          branch_name: ${{ steps.get_pull_request_sha.outputs.pull_request_sha }}
          branch_operation: "create_branch" # Alternative you can use "delete_branch"
        id: create-branch
      - run: |
          echo "branch_id: ${{ steps.preview_branch_db.outputs.branch_id }}"
          echo "host_id: ${{ steps.preview_branch_db.outputs.host_id }}"
          echo "host_url: ${{ steps.preview_branch_db.outputs.host_url }}"
```

## Outputs
```yml
outputs:
  branch_id:
    description: "Newly created branch ID"
    value: ${{ steps.output-branch-id.outputs.branch_id }}
  host_id:
    description: "Host ID for the newly created branch"
    value: ${{ steps.output-project-id.outputs.host_id }}
  host_url:
    description: "Host URL for the newly created branch"
    value: ${{ steps.output-project-id.outputs.host_url }}
```

## How to set up the NEON_API_KEY
Navigate to you the Account page on your Neon console. In the Developer Settings, Generate a new API key if you don't have one already. 
It's important not to share the API key or expose it in your actions or code. This is why you need to add the API key to a new GitHub secret.  

In your GitHub repo, go to `Settings` and and locate `Secrets` at the bottom of the left side bar. Click on `Actions` then on the `New repository secret` button to create a new  secret.
Name the secret `NEON_API_KEY` and paste the API key generated on the Neon console in the `Secret*` field, then press `Add secret` button.