# How to Publish the Extension (Locally & Marketplace)

This guide explains how to package, install, and publish your VS Code extension both locally and to the Visual Studio Code Marketplace.

---

## 🚀 Local Publishing (for Testing & Development)

### Prerequisites
- Node.js and npm installed
- VSCE (Visual Studio Code Extension Manager) installed globally:
  ```pwsh
  npm install -g @vscode/vsce
  ```

### Steps
1. **Open a terminal in the extension root folder:**
   ```pwsh
   cd c:\Users\MPhil\source\repos\MSP_VSCode_Extension\VSCodeNLCExtension\natural-language-commands
   ```
2. **Build the extension:**
   ```pwsh
   npm run compile
   ```
   _Or for continuous build:_
   ```pwsh
   npm run watch
   ```
3. **Package the extension:**
   ```pwsh
   vsce package
   ```
   This creates a `.vsix` file in the current directory.
4. **Install the extension in VS Code:**
   ```pwsh
   code --install-extension <your-extension-name>.vsix
   ```
5. **Reload or restart VS Code** to activate the extension.

---

## 🌍 Publishing to the VS Code Marketplace

### Prerequisites
  ```pwsh
  npm install -g tfx-cli
  ```

### Steps
1. **Create a Publisher** (only once):
   ```pwsh
   vsce create-publisher marcusvoicecoder
   ```
   Follow the prompts to link your publisher to your Microsoft account.
2. **Build and package your extension:**
   ```pwsh
   npm run compile
   vsce package
   ```
3. **Publish the extension:**
   ```pwsh
   vsce publish
   vsce publish minor
   ```
   - The first time, you’ll be prompted for a Personal Access Token (PAT) from Azure DevOps ([generate here](https://dev.azure.com)).
4. **Verify your extension** on the [Marketplace](https://marketplace.visualstudio.com/vscode).
5. **Update your extension** in the future by bumping the version in `package.json` and running `vsce publish` again.


## 📝 Notes
  ```pwsh
  code --uninstall-extension <your-extension-name>
  ```
## 🤖 Automating Publish with GitHub Actions

You can automatically publish to the Marketplace when changes are pushed to the `main` branch by adding a GitHub Action. This repository includes a workflow at `.github/workflows/publish.yml` which:

- Installs Node.js and dependencies
- Compiles the extension
- Uses `@vscode/vsce` to publish

Required secret:
- `VSCE_PAT` — a Personal Access Token from Azure DevOps used by `vsce` to authenticate. Create a PAT via https://dev.azure.com with the `All accessible organizations` and the `Marketplace (publish)` or `Packaging (Read & write)` scope.

How to add the secret:
1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions
2. Click New repository secret
3. Name it `VSCE_PAT` and paste the token value

When you push to `main`, the workflow will run and publish the extension (make sure `package.json` version is updated for new releases).

Note about reproducible installs:
- The GitHub Action checks for `package-lock.json`. If present it runs `npm ci`; otherwise it falls back to `npm install` to avoid failing the run. For reproducible, deterministic installs we recommend committing `package-lock.json` to the repo.

Publishing by tag or release:

- This repository is configured to publish only when you push a tag (example: `v1.2.3`) or when a GitHub Release is published. The workflow filters tags with prefix `v`.

To create a tagged release locally:

1. Bump the version in `package.json` (semantic versioning: `major.minor.patch`).
2. Create a tag and push it:

```pwsh
git tag v0.13.2
git push origin v0.13.2
```

Or create a Release in the GitHub UI and give it the same tag (the workflow also runs on `release: published`).

Note on CI behavior:
- Tag push -> The workflow packages the extension and uploads the `.vsix` as a workflow artifact. This is a safe dry-run to allow verifying the built VSIX before publishing.
- Release published -> The workflow packages and then runs `vsce publish` using the `VSCE_PAT` secret to push to the Marketplace.
